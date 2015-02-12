var express                 = require('express')
  , async                   = require('async')
  ;

var asyncFs                 = require('./util/async_fs')
  , dadt                    = require('./util/dadt')
  
  , config                  = require('./config')
  
  , CLIENT_DIR_NAME         = config.CLIENT_DIR_NAME
  , LOCALES_DIR_NAME        = config.LOCALES_DIR_NAME
  
  , DEVELOPMENT_LISTEN_PORT = config.DEVELOPMENT_LISTEN_PORT
  , PRODUCTION_LISTEN_PORT  = config.PRODUCTION_LISTEN_PORT
  ;

var client                  = require('./client')
  , locale                  = require('./locale')
  ;

/******************************************************************************
 * createServer
 */
exports.createServer = function createServer_rocket() {
  
  var args            = Array.prototype.slice.call(arguments)
    , app_dir         =  args.shift()
   
    , callback        = args.pop()
    
    , middlewares     = args.shift()
    
    , options         = args.shift() || {}
  
    ; 
      
  var app             = options.express ? express.createServer(options.express) : express.createServer()
    , original_listen = app.listen
    
    , routes          = dadt.createNode()
    ;
  
  app.listen = function() {
   
    var args  = Array.prototype.slice.call(arguments)
      , port  = (typeof args[0] === 'number' ? args.shift() : undefined) 
      ;
    
    if (!port) {
      
      if (process.env['NODE_ENV'] === 'production') {
        
        port = PRODUCTION_LISTEN_PORT;
        
      } else {
        
        port = DEVELOPMENT_LISTEN_PORT;
        
      }
      
    }
    
    args.unshift(port);
    
    return original_listen.apply(app, args);
    
  }
  
  async.forEachSeries(
      [ [ CLIENT_DIR_NAME       , async.apply(client.setup, app, middlewares, routes)   ]
      
      , [ LOCALES_DIR_NAME      , async.apply(locale.setup)                     ]   
    
      ]
    
    , function(filter, callback) {
        asyncFs.mapDir(app_dir, filter, callback);
      }
      
    , function(err) { 
        console.log('--- Rocket App Launched.');
        console.log('');
        callback(err, app); 
      }
  );
  
}
