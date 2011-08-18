var async                       = require('async')
  , fs                          = require('fs')
  , path                        = require('path')
  , express                     = require('express')
  
  , child_process               = require('child_process')
  , events                      = require('events')
  
  , EventEmitter                = events.EventEmitter
  ;

var asyncFs                     = require('../util/async_fs')
  
  , config                      = require('../config')
  
  , CLIENT_STATIC_DIR_NAME      = config.CLIENT_STATIC_DIR_NAME
  , CLIENT_JS_DIR_NAME          = config.CLIENT_JS_DIR_NAME
  
  , REQUIRE_JS_CONFIG_FILE_NAME = config.REQUIRE_JS_CONFIG_FILE_NAME
  
  , tmpdir                      = require('../util/tmpdir')
  , client_js_tmpdir            = tmpdir.mkuniqueSync()
  
  , optimize_options_tmpdir     = tmpdir.mkuniqueSync() 
  ;

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
function optimizeDir(dir_path, dst_tmpdir, callback) {
  
  var options_filename        = Date.now() + '.js'
  
    , blank_filename          = Date.now() + '-blank.js'
  
    , require_config_path     = path.join(dir_path, REQUIRE_JS_CONFIG_FILE_NAME)
  
    , options_file_path       = path.join(optimize_options_tmpdir.path, options_filename)
    
    , blank_file_path         = path.join(optimize_options_tmpdir.path, blank_filename)
    
    , blank_file_path_no_ext  = path.join(optimize_options_tmpdir.path, blank_filename.slice(0, blank_filename.length - 3))
  
    , options                 = {
                                  appDir  : dir_path
                                , dir     : dst_tmpdir.path
                                , modules : []
                                }
  
    , external_modules        = []
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
            
              global.require_configuration = data;
              
              config = JSON.parse(data);
              
              if (config.paths) {
                
                for (var name in config.paths) {
                  
                  src = config.paths[name];
                  
                  if (src.substr(0,4) === 'http') {
                    
                    external_modules.push(src);
                    config.paths[name] = blank_file_path_no_ext;
                    
                  }
                  
                }
                
                options.paths = config.paths;
                
              }
              
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
                  , symlink_path  = path.join(optimize_options_tmpdir.path, filename)
                  , module_name
                  ;
                
                fs.symlink(module_path, symlink_path, function(err) { 
                  
                  if (err) { 
                    
                    callback(err);
                    
                  } else {
                  
                    if (filename.substr(-3) === '.js' && filename !== REQUIRE_JS_CONFIG_FILE_NAME) {
                      
                      
                      
                      module_name = filename.substr(0, filename.length - 3)
                      
                      options.modules.push( 
                          { 
                            name: module_name 
                          , exclude : external_modules 
                          } 
                      );
                      
                    }
                    
                    callback(null);
                  
                 }
                
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
        
          var rjs_path  = path.join(__dirname, '../vendors/r.js')
            , child     = child_process.spawn(
                              'node'
                            , [rjs_path, '-o', options_file_path]
                          )
            ;
          
          child.stdout.on('data', function(data) {
            console.log('--- r.js : ' + data);
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
        
          optimize_options_tmpdir.clear(callback);
          
        }
      
      ]
      
    , callback
  
  );
  
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
  
  var args                = Array.prototype.slice.call(arguments)
    
    , app                 = args.shift()
    , client              = args.shift()
    
    , callback            = args.pop()
    
    , js_dir_path         = path.join(client.path, CLIENT_JS_DIR_NAME)
    
    , static_dir_path     = path.join(client.path, CLIENT_STATIC_DIR_NAME)
    
    , tree_event_emitter
    ;
  
  //sets up a static middleware to serve the webapp `client/static` folder 
  //as `/static`
  app.use('/static', express.static(static_dir_path));
  
  
  if (process.env['NODE_ENV'] === 'production') {
    
    tree_event_emitter = asyncFs.watchTree(
      path.join(client.path, CLIENT_JS_DIR_NAME)
    );
    
    tree_event_emitter.on('change', function() {
    
      optimizeDir(js_dir_path, client_js_tmpdir, function(err) {
        
        if (err) { throw err; }
        
      });
    
    });
  
    optimizeDir(js_dir_path, client_js_tmpdir, function(err) {
      
      if (err) { 
        
        callback(err); 
        return 
      
      }
      
      //sets up a static middleware to serve the webapp optimized tmp js folder 
      //as `/js`
      app.use('/js', express.static(client_js_tmpdir.path));
      
      callback(null);
      
    });
    
  } else {
    
    //sets up a static middleware to serve the webapp `client/js` folder 
    //as `/js`
    app.use('/js', express.static(js_dir_path));
    
    callback(null);
    
  }
  
}