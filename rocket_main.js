var fs = require("fs")
  , _ = require("underscore");


exports.setupControllers = function (app, top_dir, callback) {

  /**
   * @param name String = name of the Controller
   * @param method String = name of the Method
   * @param has_view Bool = true if this Controller's Method has that view
   *
   * Builds a wrapper function sending raw json as a response if no view is found
   * or a rendered view
   */
  this.buildWrapper = function(name, method, has_view, dir) {
    if(has_view) {
      return function(req, res) {
        var methods = require(dir + '/controllers/' + name + '.controller.js');
        var json = methods[method]();

        res.render(dir + '/views/' + name + '/' + name + '.' +  method + '.jade', _.extend(json, {controller: name}));
      };
    } else {
      return function(req, res) {
        var methods = require(dir + '/controllers/' + name + '.controller.js');
        var json = methods[method]();

        res.send(json);
      }
    }
  }

  /**
   * @param name String = name of the Controller
   * @param has_view Bool = true if the controller has a matching view
   *
   * Uses information from searchFolders to add the controller URL
   * to the app, introduces a wrapping function around these controller
   * calls.
   */
  this.setController = function(name, has_view, dir) {
    var wrapped_funcs = {}
      , view_methods = []
      , split = []
      , controller_methods = _.functions(require(dir + '/controllers/' + name + '.controller.js'));

    if (app._rocket_routes.indexOf(name) !== -1) {
      throw("Route already in use");
    }

    if (has_view) {
      // Get the methods for which views exist
      view_methods = fs.readdirSync(dir + '/views/' + name);

      for(var i = 0; len = view_methods.length, i < len; i++) {
        split = view_methods[i].split('.');
        view_methods[i] = split[split.length - 2];
      }
    }

    for(var i = 0; len = controller_methods.length, i < len; i++) {
      var method_view = false;

      if(view_methods.indexOf(controller_methods[i]) !== -1) {
        method_view = true;
      }

      wrapped_funcs[controller_methods[i]] = this.buildWrapper(name, controller_methods[i], method_view, dir);
    }

    if (name === 'root') {
      app.resource(wrapped_funcs);
    } else {
      app.resource(name, wrapped_funcs);
    }
  }

  /**
   * Gets the name of each controller and searches through the view folder
   * to see wether it finds a corresponding view
   */
  this.searchFolders = function(dir) {
    var controllers = fs.readdirSync(dir + '/controllers/')
      , views = fs.readdirSync(dir + '/views/')
      , has_view = false
      , split = [];

    for(var i = 0; len = views.length, i < len; i++) {
      // Gets dir/name and returns name
      split = views[i].split('/');
      views[i] = split[split.length - 1];
    }

    for(var i = 0; len = controllers.length, i < len; i++) {
       // Gets dir/name.controller.js and returns name
      split = controllers[i].split('.');
      var controller = split[split.length - 3];

      if(split[split.length - 2] !== 'controller') {
        break;
      }

      if(views.indexOf(controller) !== -1) {
        has_view = true;
      }

      this.setController(controller, has_view, dir);
    }
  }

  /**
   * This function starts the controller set up, setting the main controllers and
   * views then running through the plugin dirs
   */
  this.init = function() {
    var plugins = fs.readdirSync(top_dir + '/plugins/');

    this.searchFolders(top_dir);

    for(var i = 0; len = plugins.length, i < len; i++) {
      this.searchFolders(top_dir + '/plugins/' + plugins[i]);
    }

    callback(app);
  }

  this.init();
}
