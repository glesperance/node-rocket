var express     = require('express')
  , async       = require('async')
  ;

var asyncFs     = require('./util/async_fs')
  , dadt        = require('./util/dadt')
  ;

var client      = require('./client')
  , controller  = require('./controller')
  , view        = require('./view')
  ;

/******************************************************************************
 * createServer
 */
exports.createServer = function createServer_rocket() {
  
  var args            = Array.prototype.slice.call(arguments)
    , app_dir         =  args.shift()
    
    , app             = express.createServer()
    , express_listen  = app.listen
    
    , routes          = dadt.createNode()
    ;
  
  asyncFs.mapDir(
      app_dir
    , [ 
        
        [ 'client'      , async.apply(client.setup, app)              ]
      
      , [ 'controllers' , async.apply(controller.setup, app, routes)  ]
      
      , [ 'exports'     , async.apply(export.setup, app)              ]
      
      , [ 'views'       , async.apply(view.setup, app, routes)        ]
      
      ]
  );
  
}
/*
exports.createServer = function createServer_rocket() {
  var args = Array.prototype.slice.call(arguments)
    , app_dir =  args.shift()
    , middlewares = Array.prototype.slice.call(arguments,1)
    ;
  
  var app = express.createServer();
  
  app.rocket = {};
  app.rocket.routes = [];
  app.rocket.controllers = {};
  
  app.rocket.app_dir = app_dir;
  
  //replace listen on app
  var express_listen = app.listen;      
  app.listen = function () {
  
    var ret = express_listen.apply(this, arguments);
    
    if(missing.indexOf(EXPORT_DIR_NAME) === -1 ) {
      app.rocket.dnode.listen(app);
    }
            
    return ret;
  }

  //default configuration
  app.configure(function() {
    
    app.use(express.bodyParser());
    app.use(express.cookieParser());
  
    app.use(app.browserify);
  
   for(var i = 0, len = middlewares.length; i < len; i++) {
      app.use(middlewares[i]);
    }
    
  });
  
  //compile exports
    compileExports(app);
    
    return app;
    
  }*/