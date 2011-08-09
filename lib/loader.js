var async               = require('async')
  ;

var asyncFs             = require('./util/async_fs')
  , dadt                = require('./util/dadt')
  ;

var rocket_controllers  = require('./controllers')
  ;

/******************************************************************************
 * createServer
 */
exports.createServer = function createServer_rocket() {
  
  var args            = Array.prototype.slice.call(arguments)
    , app_dir         =  args.shift()
    , middlewares     = Array.prototype.slice.call(arguments,1)
    
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
      
      , [ 'models'      , rocket_model.setup                          ]
      
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
  
  //extend the jade engine with our filters
  var jade = require('jade');
  
  //build _rocket_index for browserify
  build_libs_index(app.rocket.app_dir);
  
  app.browserify = require('browserify')({
    mount : '/browserify.js'
  , require: path.join(app.rocket.app_dir, CLIENT_LIBS_DIR, CLIENT_LIBS_INDEX_FILENAME)
  , watch: true
  });
  
  fs.unlink(path.join(app.rocket.app_dir, CLIENT_LIBS_DIR, CLIENT_LIBS_INDEX_FILENAME), function(err){ if(err){ console.log(err); }});
  
  //default configuration
  app.configure(function() {
    app.set("view engine", 'jade');
    app.set("views", path.join(app.rocket.app_dir, VIEWS_DIR_NAME));
    app.register(".jade", jade);
    
    app.use('/static', express.static(path.join(app.rocket.app_dir, CLIENT_STATIC_DIR)));
    
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(express.cookieParser());
  
    app.use(app.browserify);
  
   for(var i = 0, len = middlewares.length; i < len; i++) {
      app.use(middlewares[i]);
    }
    
  });
  
  //setup controllers
  setupControllers(app);
  
  //setup models
  setupModels(app);
  
  //compile exports
    compileExports(app);
    
    return app;
    
  }*/