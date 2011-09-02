var async                       = require('async')
  , fs                          = require('fs')
  , path                        = require('path')
  , express                     = require('express')
  
  , jade                        = require('jade')
  
  , child_process               = require('child_process')
  , events                      = require('events')
  
  , EventEmitter                = events.EventEmitter
  
  ;

var asyncFs                     = require('../util/async_fs')

  , FileEventEmitter            = require('../util/file_event_emitter')

  , tmpdir                      = require('../util/tmpdir')
  
  , config                      = require('../config')
  
  , CLIENT_STATIC_DIR_NAME      = config.CLIENT_STATIC_DIR_NAME
  , CLIENT_JS_DIR_NAME          = config.CLIENT_JS_DIR_NAME
  , CLIENT_CSS_DIR_NAME         = config.CLIENT_CSS_DIR_NAME
  
  , CLIENT_VIEWS_DIR_NAME       = config.CLIENT_VIEWS_DIR_NAME
  
  , REQUIRE_JS_CONFIG_FILE_NAME = config.REQUIRE_JS_CONFIG_FILE_NAME
  
  , JADE_RUNTIME_FILE_NAME      = config.JADE_RUNTIME_FILE_NAME
  
  ;

/******************************************************************************
 * Compile client views located at `src_path` and saves them in `dst_path`.
 * 
 * @param src_path {String} The path of the source directory.
 * @param dst_path {String} The path of the destination directory.
 * 
 * @param callback {Function} A callback of the form `function(err)`
 */
function compileViews() {
  
  var args = Array.prototype.slice.apply(arguments)
    
    , callback          =  args.pop()
  
    , src_path          = args.shift()
    , dst_path          = args.shift()
    , production_paths  = args.shift()
    ;
  
  asyncFs.forEachFile(
  
      src_path
    
    , function (view_filename, callback) {
        
        var view_path     = path.join(src_path, view_filename)
          , view_dst_path = path.join(dst_path, view_filename + '.js')
          ;
        
        async.waterfall(
        
            [
              async.apply(fs.readFile, view_path, 'utf8')
              
            , function(data, callback) {
                
                var options = { client: true }
                  ;
                
                if (production_paths) {
                  
                  options.compileDebug = false;
                  production_paths['views/' + view_filename] = view_dst_path.substr(0, view_dst_path.length - 3);
                  
                }
                
                callback(null, jade.compile(data, options));
                
              }
              
            , function(f, callback) {
               
                var export_string = 'define([], function() { return (' + f.toString() + ')})'
                  ;
              
                fs.writeFile(view_dst_path, export_string, 'utf8', callback);
              
              }
              
            ]
          
          , function(err) { if (err) { throw err; } callback(err)}
            
        );
        
      }
      
    , callback
  
  );
  
}

/******************************************************************************
 * 
 */
function setupDevModeViews(client_views_path, client_views_tmpdir, callback) {
  
  var tree_emitter  = asyncFs.watchTree(client_views_path)
    ;
  
  tree_emitter.on('change', function() {
    
    async.waterfall(
      
        [
        
          function(callback) { client_views_tmpdir.clear(callback); }
        
        , function(callback) { 
            compileViews(client_views_path, client_views_tmpdir.path, callback); 
          }
        
        ]
      
      , function(err) {
          
          if (err) { throw(err); }
          
        }
    );
    
  });
  
  compileViews(client_views_path, client_views_tmpdir.path, callback);
  
}

/******************************************************************************
 * Reads and exports the `require.config.json` file for the controller module
 * to access. Also wacthes the file for changes and reloads it accordingly.
 * 
 * @param config_file_path {String} The path of the configuration file
 * @param callback {Function} A function of the form `function(err)`
 */
function watchAndExportConfig(config_file_path, callback) {
  
  var config_file_emitter = new FileEventEmitter(config_file_path)
    ;
  
  function exportConfig(callback) {

    fs.readFile(config_file_path, 'utf8', function(err, data) {
      
      var json
        ;
      
      if (err) { callback(err); return; }
      
      json = JSON.parse(data) || {};
      
      json.baseUrl = '/js';
      
      json.paths = json.paths || {};
      json.paths['jade-runtime'] = path.join('rocket', 'vendors', JADE_RUNTIME_FILE_NAME.substr(0, JADE_RUNTIME_FILE_NAME.length - 3));
      json.paths['now'] = '/nowjs/now';
      
      global.require_configuration = JSON.stringify(json);
      
      callback(null);
      
    });

  }
  
  config_file_emitter.on('changes', function() {
    
    exportConfig(function(err) {
      
      if (err) { throw err; }
      
    });
    
  });
  
  exportConfig(callback);

}

/******************************************************************************
 * Optimize the specified directory using RequireJS `r.js` utility, saving the
 * optimized files in the directory pointed by `dst_tmpdir`.
 * 
 * @param dir_path {String} The path pointing to the directory containing the
 * files to be optimized.
 * 
 * @param dst_tmpdir {ChildTmpdir} A ChildTmpdir defining the directory where
 * the optimized files are to be stored.
 * 
 * @param callback {Function} A callback of the form `function(err)`
 */
function optimizeDir(dir_path, dst_tmpdir, options_tmpdir, callback) {
  
  var options_filename              = Date.now() + '.js'
  
    , blank_filename                = Date.now() + '-blank.js'
    
    , jade_runtime_filename         = Date.now() + '-jade-runtime.js'
    
    , require_config_path           = path.join(dir_path, REQUIRE_JS_CONFIG_FILE_NAME)
  
    , options_file_path             = path.join(options_tmpdir.path, options_filename)
    
    , blank_file_path               = path.join(options_tmpdir.path, blank_filename)
    , blank_file_path_no_ext        = path.join(options_tmpdir.path, blank_filename.slice(0, blank_filename.length - 3))
    
    , tmp_jade_runtime_path         = path.join(options_tmpdir.path, jade_runtime_filename)
    , tmp_jade_runtime_path_no_ext  = path.join(options_tmpdir.path, jade_runtime_filename.slice(0, jade_runtime_filename.length - 3))
  
    , options                       = {
                                        appDir  : dir_path
                                      , baseUrl : './'
                                      , dir     : dst_tmpdir.path
                                      , modules : []
                                      //, optimize: 'none'
                                      }
  
    , external_modules              = []
  
    , views                         = false
    ;
  
  async.waterfall( 
      [
        
        function(callback) {
          
          fs.readFile(require_config_path, 'utf8', function(err, data) {
            
            var config
              , src
              ;
            
            if (err) { 
              
              if (err.code !== 'ENOENT') {
              
                callback(err);
              
              } else {
              
                callback(null); 
              
              }
              
            } else {
              
              config = JSON.parse(data);
              
              if (config.paths) {
                
                for (var name in config.paths) {
                  
                  src = config.paths[name];
                  
                  if (src.substr(0,4) === 'http') {
                    
                    external_modules.push(name);
                    config.paths[name] = blank_file_path_no_ext;
                    
                  }
                  
                }
                
                options.paths = config.paths;
                
              }
              
              options.paths = options.paths || {};
              
              options.paths['jade-runtime'] = tmp_jade_runtime_path_no_ext
              
              external_modules.push('now');
              options.paths['now']          = blank_file_path_no_ext
              
              callback(null);
              
            }
            
          });
          
        }
        
      , async.apply(fs.readdir, dir_path)
      
      , function(files, callback) {
          
          async.forEach(
              
              files
            
            , function iterator(filename, callback) {
                
                var module_path   = path.join(dir_path, filename)
                  , symlink_path  = path.join(options_tmpdir.path, filename)
                  , module_name
                  ;
                
                if (filename === REQUIRE_JS_CONFIG_FILE_NAME) {
                
                  callback(null);
                  return;
                
                } else if (filename === CLIENT_VIEWS_DIR_NAME) {
                  
                  views = true;

                  async.waterfall(
                      [
                        function(callback) { fs.mkdir(symlink_path, '0755', callback); }
                      , function(callback) { compileViews(module_path, symlink_path, options.paths, callback); }
                      ]
                    , callback
                  );
                  
                  return;
                  
                }
                
                fs.symlink(module_path, symlink_path, function(err) { 
                  
                  if (err) { 
                    
                    callback(err);
                    return;
                    
                  }
                  
                  var suffix = '_client.js';
                  
                  if (filename.substr(-suffix.length) === suffix) {
                    
                    module_name = filename.substr(0, filename.length - 3)
                    
                    options.modules.push( 
                        { 
                          name: module_name 
                        , exclude : external_modules 
                        } 
                    );
                    
                  }
                  
                  callback(null);
                
                });
                
              } 
            
            , callback
          )
          
        }
        
      , function(callback) { 
          
          dst_tmpdir.clear(callback);
          
        }
      
      , function(callback) {
      
          var data = JSON.stringify(options)
            ;
          
          fs.writeFile(
              
              options_file_path
          
            , data
          
            , 'utf8'
            
            , callback
            
          );
      
        }
        
      , async.apply(fs.writeFile, blank_file_path, '', 'utf8')
      
      , function(callback) {
          
          if (views) {
        
            fs.symlink(path.join(__dirname, 'rocket-js', 'vendors', JADE_RUNTIME_FILE_NAME), tmp_jade_runtime_path, callback);
            
          } else {
            
            callback(null);
            
          }
        
        }
        
      , function(callback) {
        
          var rjs_path  = path.join(__dirname, '../vendors/r.js')
            , child     = child_process.spawn(
                              'node'
                            , [rjs_path, '-o', options_file_path]
                          )
            ;
                    
          child.stdout.on('data', function(data) {
            process.stdout.write(".");
          });
          
          child.stderr.on('data', function(data) {
            console.log('xxx r.js : ' + data);
          });
          
          child.on('exit', function(code) {
                        
            var error
              ;
            
            if (code !== 0) {
            
              error = 'xxx r.js : process exited with code [' + code + ']';
              
              console.log(error);
              
              callback(error)
              
            }
            
            callback(null);
            
          });
        
        }
      
      , function(callback) { 
        
          options_tmpdir.clear(callback);
         
        }
      
      ]
      
    , callback
  
  );
  
}

/*****************************************************************************
 * Watches the directory tree under `path` and creates an optimized version
 * of it, using RequireJS' r.js, and saves it in the directory described by
 * `dst_tmpdir`, using `options_tmpdir` as working directory.
 * 
 * The directory is optimized each time a changes in the watched directory tree
 * is detected.
 * 
 * @param path {String} The path of the folder to optimize.
 * 
 * @param dst_tmpdir {Tmpdir} The destination (temporary) directory.
 * 
 * @param options_tmpdir {Tmpdir} The working temporary directory given as
 * a `Tmpdir` instance
 * 
 * @param callback {Function} a callback of the form `function(err)`
 */
function watchAndOptimize(path, dst_tmpdir, options_tmpdir, callback) {
  
  var tree_event_emitter = asyncFs.watchTree(path);
    ;
    
  tree_event_emitter.on('change', function() {
  
    process.stdout.write('\n-- Change in tree detected');
    
    optimizeDir(path, dst_tmpdir, options_tmpdir, function(err) {
      
      if (err) { throw err; }
      
    });
  
  });
  
  optimizeDir(path, dst_tmpdir, options_tmpdir, function(err) {
    
    if (err) { 
      
      callback(err); 
      return;
    
    }
    
    callback(null);
    
  });

}

/******************************************************************************
 * Setups the client related resources. 
 *
 * It 
 *    * sets up a static middleware to serve the webapp `client/static` folder 
 *    as `/static`
 *    
 *    * sets up a static middleware to serve the rocket `rocket-js` folder
 *    as `/rocket-js`
 *    
 *    * sets up a static middleware to serve the webapp `client/js` folder as
 *    `/js` (except when in production) 
 *    
 * Moreover, when in production
 * it
 * 
 *    * optimizes -- with requireJS' `r.js` -- the modules at the root of 
 *    `client/js` by packing it with all its dependencies and then uglifying it.
 *    
 *    * serves those modules via a static middleware as `/js`
 *    
 * Finally, rocket watches the webapp `client/js` directory and updates its
 * related resources accordingly when new files are found or changes committed.
 * 
 * @param app {Object} The app object as returned by express, connect, or
 * rocket.
 * 
 * @param client {Object} The FileEventEmitter object of the `client`
 * folder.
 *                        
 * @param callback {Function} A callback of the form `function(err)`
 */
exports.setup = function setup_client() {
  
  var args                    = Array.prototype.slice.call(arguments)
    
    , app                     = args.shift()
    , client                  = args.shift()
    
    , callback                = args.pop()
    
    , js_dir_path             = path.join(client.path, CLIENT_JS_DIR_NAME)
    
    , css_dir_path            = path.join(client.path, CLIENT_CSS_DIR_NAME)
    
    , views_dir_path          = path.join(js_dir_path, CLIENT_VIEWS_DIR_NAME)
    
    , static_dir_path         = path.join(client.path, CLIENT_STATIC_DIR_NAME)
    
    , require_js_config_path  = path.join(js_dir_path, REQUIRE_JS_CONFIG_FILE_NAME)
    
    , client_js_tmpdir        = tmpdir.mkuniqueSync()
    , client_css_tmpdir       = tmpdir.mkuniqueSync()
    
    , client_views_tmpdir     = tmpdir.mkuniqueSync()
    
    , optimize_js_tmpdir      = tmpdir.mkuniqueSync()
    , optimize_css_tmpdir     = tmpdir.mkuniqueSync()
    
    , js_tree_event_emitter
    
    , css_tree_event_emitter
    ;
  
  /***
   * sets up a static middleware to serve the webapp `client/static` folder 
   * as `/static`
   */
  app.use('/static', express.static(static_dir_path));
  
  /***
   * sets up a static middleware to serve the rocket `rocket-js` folder
   * as `/rocket-js`
   */
  app.use('/js/rocket', express.static(path.join(__dirname, 'rocket-js')));
  
  if (process.env['NODE_ENV'] === 'production') {
    
    async.parallel([
        function(callback) { async.waterfall([
          
            async.apply(watchAndOptimize, js_dir_path, client_js_tmpdir, optimize_js_tmpdir)
          
          , function(callback) {
              
              //sets up a static middleware to serve the webapp optimized tmp js folder 
              //as `/js`
              app.use('/js', express.static(client_js_tmpdir.path));
              
              callback(null);
            }
        
        ], callback);}
        
      , function(callback) { async.waterfall([
                                              
            async.apply(watchAndOptimize, css_dir_path, client_css_tmpdir, optimize_css_tmpdir)
          
          , function(callback) {
            
              //sets up a static middleware to serve the webapp optimized tmp css folder 
              //as `/css`
              app.use('/css', express.static(client_css_tmpdir.path));
            
              callback(null);
              
            }
        
        ], callback); }
      
      , async.apply(watchAndExportConfig, require_js_config_path)
        
    ], callback);
    
  } else {
    
    //sets up a static middleware to serve the webapp `client/js` folder 
    //as `/js`
    app.use('/js', express.static(js_dir_path));
    app.use('/css', express.static(css_dir_path));
    
    app.use('/js/views', express.static(client_views_tmpdir.path));
    
    async.parallel(
        
        [
          async.apply(setupDevModeViews, views_dir_path, client_views_tmpdir)
        , async.apply(watchAndExportConfig, require_js_config_path)
        ]
        
      , callback
      
    );
    
    
  }
  
}