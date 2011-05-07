var _ = require("underscore");
var express = require("express");
var fs = require("fs");
var controllers = require("./controllers");
var DNode = require("DNode");


/**
 * Configure Express Engine. 
 * TODO: CLEAN THIS + IMPLEMENT PROPER CONFIGURATION FILE w/ route overriding
 */
App.prototype.setupExpress = function(app){
  return function(){
    app.express.set("view_engine", app.config.template_engine);
    app.express.set("views", app.config.app_path + "/" + app.config.dir_names.templates);
    app.express.register(".jade",require(app.config.template_engine));
    app.express.use(express.bodyParser());
    app.express.use('/static', express.static(app.config.app_path + '/' + app.config.dir_names.static));
    
    app.express.use(require('browserify')({
        base : app.config.app_path + "/" + "client",
        mount : '/browserify.js',
        /*filter: function(orig_code){
          var jsp = require("uglify-js").parser;
        var pro = require("uglify-js").uglify;
        var ast = jsp.parse(orig_code); // parse code and get the initial AST
        ast = pro.ast_mangle(ast); // get a new AST with mangled names
        ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
        return pro.gen_code(ast); // compressed code here
        },*/
        require: ['jade', 'backbone', 'underscore']
    }));
    
  };
};


/**
 * Setup the Controllers.
 */
App.prototype.setupControllers = function(){
  var controllers_dir = this.config.app_path + "/" + this.config.dir_names.controllers;
  
  var callable_regexp = /^[_].*$/i;
  
  fs.readdir(
      controllers_dir,
      function(context){
        return function(err, files){
          if(err){throw err;}
          _.each(
              files,
              function(file){
            	var suffix = "_controller";
            		
            	//remvoe extension
            	file = file.split(".")[0];
            	
                var controller_file = controllers_dir + "/" + file;
                var controller = require(controller_file);
                
                var controller_callables = _.select(
                            _.functions(controller),
                            function(elt){
                              return !(callable_regexp.test(elt));
                            }, this);
                

            	//remove suffix
            	file = file.substr(0, file.length - suffix.length);
                
                /**
                 * Setup All non-index Controllers.
                 */
                _.each(
                    controller_callables, 
                    function(callable){
                      
                      var template_path = this.config.app_path 
                      + "/" + this.config.dir_names.templates 
                      + "/" + file
                      + "/" + callable + "." + this.config.template_engine;
                      
                      //console.log(template_path);
                      
                      fs.readFile( template_path,
                      function(app){ 
                        return function(err, data){
                          
                          app.controllers.push(new controllers.Controller({
                            path: file,
                            route: (file == "root" ? "" : file) + (callable == "index" ? "" : "/" + callable),
                            callable: controller[callable],
                            template: (err) ? false : file + "/" + callable + "." + app.config.template_engine
                          }, app));
                        };
                      }(this));
                    }, this);
              }, context);
        };
    }(this));
  
}
/**
 * Start the server.
 */
App.prototype.start = function(){
  this.express.listen(this.config.listen_port);
  this.started = true;
  
  var Session = require(this.config.app_path + "/dnode/sessions").Session;
  
  console.log(new Session());
  DNode(Session).listen(this.express);
}

/**
 * App Constructor.
 * @param config The configuration _object_ of the App.
 * @returns {App}
 */
exports.App = App;
function App(config){
  
  this.controllers = [];
  
  this.started = false;
  
  /**
   * Save the Config.
   */
  this.config = require("./config").load_config(config);
  
  /**
   * Create Express/Connect Server.
   */
  this.express = express.createServer();
  
  /**
   * Apply the Configuration.
   */
  this.setupExpress(this)();
  
  /**
   * Create and Connect All Controllers.
   */
  this.setupControllers();
};