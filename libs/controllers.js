var _ = require('underscore');

/**
 * Initialize Controller.
 */
Controller.prototype.init = function(app){
  (app.config.verbose) ? console.log(this) : false;
  
  app.express[this.method]("/" + this.route, this.callable_wrapper(this));
};

Controller.prototype.callable_wrapper = 
  function(controller){
  return  function(req, res){
  
    (controller.verbose) ? console.log("--- " + controller.route + req) : false;

    var boot_options = controller["callable"](req,res);
    
    if(controller.template){
      if(controller.verbose){
        console.log("--- Rendering [" + controller.template + "]");
      }
      
      if(typeof(boot_options) != "undefined" && typeof(boot_options) != "object"){
		  throw "xxx Only Objects are Allowed as return values.";		  
	  }
      
      var ret = {
        boot_options: boot_options,
      	path: controller.path
      };
      
      console.log(ret);
      
      res.render(controller.template, ret);
    }
  };
};

/**
 * Controller Constructor
 */
function Controller(dict, app){
  
  this.method = "get";
  
  /**
   * Check For Required Arguments.
   */
  _.each(  ['path', 'route', 'callable'], 
      function(arg){ 
        if(arg == undefined){ 
          throw   "xxx Couldn't create " 
              + arguments.calle.name
              + ": " + arg + "Missing.";
        }
      }, this);
  
  this.verbose = app.config.verbose;
  
  this.callable = dict["callable"];
  /**
   * Setup Object Members.
   */
  _.each(  ['path', 'route', 'method', 'callable', 'template'], 
      function(arg){(dict[arg] != undefined ? this[arg] = dict[arg] : false);}, this);
  this.init(app);
}

/**
 * Export the Controller Class.
 */
exports.Controller = Controller;