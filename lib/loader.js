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
    , function(err) { callback(err, app); }
  );
  
  
  
}
/*
exports.createServer = function createServer_rocket() {

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
  
  //compile exports
    compileExports(app);
