var async                       = require('async')
  , express                     = require('express')
  
  , child_process               = require('child_process')
  , events                      = require('events')
  
  , EventEmitter                = events.EventEmitter
  ;

var asyncFs                     = require('../utils/async_fs')

  , DepsWatcher                 = require('../utils/deps_watcher')
  
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
  
  var options_filename    = Date.now() + '.js'
  
    , blank_filename      = Date.now() + '-blank.js'
  
    , require_config_path = path.join(dir_path, REQUIRE_JS_CONFIG_FILE_NAME)
  
    , options_path        = path.join(optimize_options_tmpdir.path, options_filename)
    
    , blank_path          = path.join(optimize_options_tmpdir.path, blank_filename)
  
    , options             = {
                              appDir  : dir_path
                            , dir     : dst_tmpdir.path
                            , modules : []
                            }
  
    , external_modules    = []
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
              
              return; 
              
            }
            
            config = JSON.parse(data);
            
            if (data.paths) {
              
              for (var name in data.paths) {
                
                src = data.paths[name];
                
                if (src.substr(0,4) === 'http') {
                  
                  external_modules.push(src);
                  data.paths[name] = blank_path;
                  
                }
                
              }
              
              options.paths = data.paths;
              
            }
            
          });
          
        }
        
      , async.apply(fs.readdir, dir_path)
      
      , function(files, callback) {
          
          async.forEach(
              
              files
            
            , function iterator(filename, callback) {
                
                var module_name
                  ;
                
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
            
            , callback
          )
          
        }
        
      , async.apply(dst_tmpdir.clear)
      
      , async.apply(
          
            fs.writeFile
        
          , options_file_path
        
          , JSON.stringify(options)
        
          , 'utf8'
          
        )
        
      , async.apply(fs.writeFile, blank_file_path, '', 'utf8')
        
      , function(callback) {
        
          var rjs_path  = path.join(__dirname, '../vendors/r.js')
            , options_file_path = optimize_options_tmpdir.path()
            , child     = child_process.spawn(
                              rjs_path
                            , ['-o', options_file_path]
                          )
            ;
          
          child.stdout.on('data', function(data) {
            console.log('--- r.js : ' + data);
          });
          
          child.stderr.on('data', function(dara) {
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
      
      , async.apply(optimize_options_tmpdir.clear)
      
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
  
  if (process.env['NODE_ENV'] === 'production') {
    
    tree_event_emitter = asyncFs.watchTree(
      path.join(client.path, CLIENT_JS_DIR_NAME)
    );
    
    tree_event_emitter.on('change', function() {
    
      optimizeDir(js_dir_path, function(err) {
        
        if (err) { throw err; }
        
      });
    
    });
  
    optimizeDir(js_dir_path, function(err) {
      
      if (err) { 
        
        callback(err); 
        return 
      
      }
      
      //sets up a static middleware to serve the webapp optimized tmp js folder 
      //as `/js`
      app.use('/js', express.static(client_js_tmpdir.path));
      
      callback(null);
      
    });
    
  } else {
    
    //sets up a static middleware to serve the webapp `client/js` folder 
    //as `/js`
    app.use('/js', express.static(js_dir_path));
    
  }
  
  //sets up a static middleware to serve the webapp `client/static` folder 
  //as `/static`
  app.use('/static', express.static(static_dir_path));
  
}