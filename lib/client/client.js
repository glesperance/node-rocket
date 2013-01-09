var async                         = require('async')
  , fs                            = require('fs')
  , path                          = require('path')
  , express                       = require('express')
  
  , jade                          = require('jade')
  
  , child_process                 = require('child_process')
  , events                        = require('events')
  
  , EventEmitter                  = events.EventEmitter
  
  , requirejs                     = require('requirejs')
  , rimraf                        = require('rimraf')
  , wrench                        = require('wrench')
  , util                          = require('util')
  ;

var asyncFs                       = require('../util/async_fs')

  , FileEventEmitter              = require('../util/file_event_emitter')

  , tmpdir                        = require('../util/tmpdir')
  
  , config                        = require('../config')
  
  , CLIENT_BUILD_DIR_NAME         = config.CLIENT_BUILD_DIR_NAME
  , CLIENT_BUILD_JSON_FILE_NAME   = config.CLIENT_BUILD_JSON_FILE_NAME

  , CLIENT_STATIC_DIR_NAME        = config.CLIENT_STATIC_DIR_NAME
  
  , CLIENT_JS_DIR_NAME            = config.CLIENT_JS_DIR_NAME
  , CLIENT_JS_TEMPLATES_DIR_NAME  = config.CLIENT_JS_TEMPLATES_DIR_NAME
  
  , CLIENT_CSS_DIR_NAME           = config.CLIENT_CSS_DIR_NAME
  
  , CLIENT_VIEWS_DIR_NAME         = config.CLIENT_VIEWS_DIR_NAME
  
  , REQUIRE_JS_CONFIG_FILE_NAME   = config.REQUIRE_JS_CONFIG_FILE_NAME
  
  , JADE_RUNTIME_FILE_NAME        = config.JADE_RUNTIME_FILE_NAME
  
  , STATIC_FILES_CACHE_LIFETIME   = config.STATIC_FILES_CACHE_LIFETIME
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
    
    , function (view_filename, top_callback) {
        
        var view_path     = path.join(src_path, view_filename)
          , view_dst_path = path.join(dst_path, view_filename + '.js')
          ;
        
        async.waterfall(
        
            [
              
              async.apply(fs.stat, view_path)
              
            , function(stats, callback) {
                
                var view_dst_path_noext = view_dst_path.slice(0, -'.js'.length)
                  ;
                
                if (stats.isDirectory()) {
                  
                  async.waterfall(
                      [
                        async.apply(fs.mkdir, view_dst_path_noext, '0777')
                      , async.apply(compileViews, view_path, view_dst_path_noext)
                      ]
                    , top_callback
                  );
                  
                } else if (stats.isFile()) {
                  
                  if (view_filename.slice(-'.jade'.length) === '.jade') {
                    callback(null);
                  
                  } else {
                    fs.symlink(view_path, view_dst_path_noext, top_callback);
                  
                  }
                  
                } else {
                  callback('UNSUPORTED_VIEW_FS_NODE');
                }
                
              }
              
            , async.apply(fs.readFile, view_path, 'utf8')
              
            , function(data, callback) {
                
                var options = { client: true }
                  ;
                
                if (production_paths) {
                  
                  options.compileDebug = false;
                  production_paths[CLIENT_VIEWS_DIR_NAME + '/' + view_filename] = view_dst_path.substr(0, view_dst_path.length - 3);
                  
                }
                
                try {
                  callback(null, jade.compile(data, options));
                } catch(e) {
                  console.log('xxx Error compiling view :', view_filename);
                  throw e;
                }
                
              }
              
            , function(f, callback) {
               
                var export_string = 'define([\'jade-runtime\'], function() { return (' + f.toString() + ') });'
                  ;
              
                fs.writeFile(view_dst_path, export_string, 'utf8', callback);
              
              }
              
            ]
          
          , function(err) { if (err) { throw err; } top_callback(err); }
            
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
      
      try {
        json = JSON.parse(data) || {};
      } catch (e) {
        console.log('xxx ERROR parsing `require.config.json`');
        throw(e);
      }
      
      json.baseUrl = '/js';
      
      json.paths = json.paths || {};
      json.paths['jade-runtime'] = path.join('rocket', 'vendors', JADE_RUNTIME_FILE_NAME.substr(0, JADE_RUNTIME_FILE_NAME.length - 3));
      
      if (!json.paths['now'])
        json.paths['now'] = '/nowjs/now';
      
      global.require_configuration = json;
      
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
    
    , require_config_path           = path.join(dir_path, REQUIRE_JS_CONFIG_FILE_NAME)
  
    , options_file_path             = path.join(options_tmpdir.path, options_filename)
  
    , options                       = { appDir  : options_tmpdir.path
                                      , baseUrl : './'
                                      , dir     : dst_tmpdir.path
                                      , modules : []

                                      // , optimize : 'none'
                                      , optimize: 'uglify'
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
                  
                  if (Array.isArray(src) || src.substr(0,4) === 'http') {
                    
                    external_modules.push(name);
                    config.paths[name] = 'empty:';
                    
                  }
                  
                }
                
                options.paths = config.paths;
                
              }
              
              config.optimize && (options.optimize = config.optimize);

              options.uglify2 = config.uglify2;
              options.generateSourceMaps= config.generateSourceMaps;
              options.preserveLicenseComments = config.preserveLicenseComments;
              
              options.paths = options.paths || {};
              
              options.paths['jade-runtime'] = 'empty:';
              
              external_modules.push('now');
              options.paths['now'] = 'empty:';
              
              callback(null);
              
            }
            
          });
          
        }

      , function (callback) {
          compileViews(dir_path, options_tmpdir.path, options.paths, callback);
        }
        
      , async.apply(fs.readdir, dir_path)
      
      , function(files, callback) {
          
          async.forEach(
              
              files
            
            , function iterator(filename, callback) {
                
                var module_name
                  ;
                
                if (filename === REQUIRE_JS_CONFIG_FILE_NAME) {
                  callback(null);
                  return;
                }

                var suffix = '_client.js';
                
                if (filename.substr(-suffix.length) === suffix) {
                  module_name = filename.substr(0, filename.length - 3);
                  
                  options.modules.push( 
                      { name    : module_name 
                      , exclude : external_modules 
                      } 
                  );
                }
                  
                callback(null);
              } 

            , callback
          )
          
        }

      , function (callback) {
          requirejs.optimize(options, function (buildResponse) {
            callback(null);
          })
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
  
  // var tree_event_emitter = asyncFs.watchTree(path);
  //   ;
    
  // tree_event_emitter.on('change', function() {
  
  //   process.stdout.write('\n-- Change in tree detected');
    
  //   optimizeDir(path, dst_tmpdir, options_tmpdir, function(err) {
      
  //     if (err) { throw err; }
      
  //   });
  
  // });
  
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
 * @param middlewares {Array<Function||Array<String, Function>>} An array of functions
 * representing connect/express middlewares -- or -- an array of Array having a route
 * string as its first element on which to restrict the application of the middleware
 * that is provided as the second element of the array.
 * 
 * @param client {Object} The FileEventEmitter object of the `client`
 * folder.
 *                        
 * @param callback {Function} A callback of the form `function(err)`
 */
exports.setup = function setup_client() {
  
  var args                      = Array.prototype.slice.call(arguments)
    
    , app                       = args.shift()
    , middlewares               = args.shift()
    
    , client                    = args.shift()
    
    , callback                  = args.pop()
    
    , js_dir_path               = path.join(client.path, CLIENT_JS_DIR_NAME)
    
    , css_dir_path              = path.join(client.path, CLIENT_CSS_DIR_NAME)
    
    , views_dir_path            = path.join(js_dir_path, CLIENT_VIEWS_DIR_NAME)
    
    , static_dir_path           = path.join(client.path, CLIENT_STATIC_DIR_NAME)
    
    , require_js_config_path    = path.join(js_dir_path, REQUIRE_JS_CONFIG_FILE_NAME)
    
    , client_views_tmpdir       = tmpdir.mkuniqueSync()
    
    , optimize_js_tmpdir        = tmpdir.mkuniqueSync()
    , optimize_css_tmpdir       = tmpdir.mkuniqueSync()

    , app_dir_path              = path.join(client.path, '..')
    , app_package_json_path     = path.join(app_dir_path, 'package.json')

    , client_build_dir_path     = path.join(app_dir_path, CLIENT_BUILD_DIR_NAME)

    , client_build_json_path    = path.join(client_build_dir_path, CLIENT_BUILD_JSON_FILE_NAME)
    , client_build_js_dir_path  = path.join(client_build_dir_path, CLIENT_JS_DIR_NAME)
    , client_build_css_dir_path = path.join(client_build_dir_path, CLIENT_CSS_DIR_NAME)
    
    , js_tree_event_emitter
    
    , css_tree_event_emitter

    , packageInfo
    , buildClient
    ;
  
  /***
   * sets up a static middleware to serve the webapp `client/static` folder 
   * as `/static`
   */
  app.use('/static', express.static(static_dir_path));
  
  function doneCallback() {
    if (middlewares) {
      for (var i = 0, ii = middlewares.length; i < ii; i++) {
        if ( Array.isArray(middlewares[i]) ) {
          app.use(middlewares[i][0], middlewares[i][1]);

        } else {
          app.use(middlewares[i]);
        }
      }
    }
    
    callback.apply(this, arguments)
  }
  
  if (process.env['NODE_ENV'] === 'production') {

    async.waterfall(
      [ function (callback) {
          fs.readFile(app_package_json_path, 'utf8', function (err, packageJSON) {

            if (err && err.code === 'ENOENT')
              callback(null, true);
            else if (err)
              callback(err);

            else {
              packageInfo = JSON.parse(packageJSON);

              fs.readFile(client_build_json_path, 'utf8', function (err, buildJSON) {
                var buildInfo;

                if (err && err.code === 'ENOENT')
                  callback(null, true);
                else if (err)
                  callback(err);

                else {
                  buildInfo = JSON.parse(buildJSON);

                  if (buildInfo.version === packageInfo.version)
                    callback(null, false);
                  else
                    callback(null, true);
                }
              })
            }
          })
        }

      , function (_buildClient, callback) {
          buildClient = _buildClient;

          if (buildClient) {
            console.log('--- Building optimized client bundle. This may take several minutes.');

            rimraf(client_build_dir_path, function (err) {
              if (err && err.code === 'ENOENT')
                callback(null);
              else
                callback(err);
            });
          }
          
          else
            callback(null);
        }

      , function (callback) {

          if (buildClient)
            async.forEachSeries(
                [ client_build_dir_path
                , client_build_js_dir_path
                , client_build_css_dir_path
                ]
              
              , function (dirPath, callback) {
                  fs.mkdir(dirPath, callback);
                }

              , callback
            );

          else
            callback(null);
        }
                                          
      , function (callback) {
            async.parallel(
                [ function (callback) { 
                    async.waterfall(
                        [ function (callback) {
                            if (buildClient)
                              watchAndOptimize(js_dir_path, { path : client_build_js_dir_path }, optimize_js_tmpdir, callback);

                            else
                              callback(null);
                          }

                        , function (callback) {
                            if (packageInfo)
                              fs.writeFile(client_build_json_path, JSON.stringify(packageInfo), 'utf8', function (err) {
                                callback(err);
                              });
                            else
                              callback(null);
                          }

                        , function (callback) {
                            if (buildClient)
                              wrench.copyDirRecursive(
                                  path.join(__dirname, 'rocket-js')
                                , path.join(client_build_js_dir_path, 'rocket')
                              , callback);

                            else
                              callback(null);
                          }
                    
                        , function(callback) {
                        
                            //sets up a static middleware to serve the webapp optimized tmp js folder 
                            //as `/js`
                            app.use('/js', express.static(client_build_js_dir_path));

                            if (buildClient) {
                              console.log('\t--- JS build done.');
                            }
                            
                            callback(null);
                          }
                  
                        ]
                      , callback
                    );
                  }
                  
                , function (callback) { 
                    async.waterfall(

                        [ function (callback) {
                            if (buildClient)
                              watchAndOptimize(css_dir_path, { path : client_build_css_dir_path }, optimize_css_tmpdir, callback);

                            else
                              callback(null);
                          }

                        , function(callback) {

                            if (buildClient) {
                              console.log('\t--- CSS build done.');
                            }

                            //sets up a static middleware to serve the webapp optimized tmp css folder 
                            //as `/css`
                            app.use('/css', express.static(client_build_css_dir_path));
                        
                            callback(null);
                          }
              
                        ]
                      , callback
                    ); 
                  }
            
                , async.apply(watchAndExportConfig, require_js_config_path)
              ]
              , function (err) {
                  if (buildClient) {
                    if (err)
                      console.log('xxx ERROR Building client:', err);
                    else
                      console.log('--- Client Bundle Successfully Built');
                  }

                  callback(err);
                }
            );
        }
      ]
    , doneCallback);  
    
  } else {
    
    /***
     * sets up a static middleware to serve the rocket `rocket-js` folder
     * as `/rocket-js`
     */
    app.use('/js/rocket', express.static(path.join(__dirname, 'rocket-js')));

    //sets up a static middleware to serve the webapp `client/js` folder 
    //as `/js`
    app.use('/js', express.static(js_dir_path));
    app.use('/css', express.static(css_dir_path));
    
    app.use('/js', express.static(client_views_tmpdir.path));
    
    async.parallel([ 
        async.apply(setupDevModeViews, js_dir_path, client_views_tmpdir)
      , async.apply(watchAndExportConfig, require_js_config_path)
    ], doneCallback);
    
  }
}
