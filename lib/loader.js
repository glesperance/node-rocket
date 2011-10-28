var express                 = require('express')
  , async                   = require('async')
  ;

var asyncFs                 = require('./util/async_fs')
  , dadt                    = require('./util/dadt')
  
  , config                  = require('./config')
  
  , CLIENT_DIR_NAME         = config.CLIENT_DIR_NAME
  , CONTROLLERS_DIR_NAME    = config.CONTROLLERS_DIR_NAME
  , EXPORTS_DIR_NAME        = config.EXPORTS_DIR_NAME
  , VIEWS_DIR_NAME          = config.VIEWS_DIR_NAME
  , LOCALES_DIR_NAME        = config.LOCALES_DIR_NAME
  
  , DEVELOPMENT_LISTEN_PORT = config.DEVELOPMENT_LISTEN_PORT
  , PRODUCTION_LISTEN_PORT  = config.PRODUCTION_LISTEN_PORT
  ;

var client                  = require('./client')
  , controller              = require('./controller')
  , export                  = require('./export')
  , view                    = require('./view')
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
    
    , app             = express.createServer(options.express)
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
  
  if (middlewares) {
    
    for (var i = 0, ii = middlewares.length; i < ii; i++) {
      
      if ( Array.isArray(middlewares[i]) ) {
      
        app.use(middlewares[i][0], middlewares[i][1]);
        
      } else {
        
        app.use(middlewares[i]);
      
      }
      
    }
    
  }
  
  asyncFs.mapDir(
      
      app_dir
      
    , [ 
        
        [ CLIENT_DIR_NAME       , async.apply(client.setup, app)                ]
      
      , [ CONTROLLERS_DIR_NAME  , async.apply(controller.setup, app, routes)    ]
      
      , [ EXPORTS_DIR_NAME      , async.apply(export.setup, app, options.nowjs) ]
      
      , [ VIEWS_DIR_NAME        , async.apply(view.setup, app, routes)          ]
        
      , [ LOCALES_DIR_NAME      , async.apply(locale.setup)                     ]   
      
      ]
    
    , function(err) { callback(err, app); }
  
  );
  
}
