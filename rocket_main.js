
var fs = require("fs")
  , _ = require("underscore");


exports.setupControllers = function (app, dir, callback) {

    this.set = function(views, call) {

        fs.readdir(dir + '/controllers/', function(err, files) {
            if (err !== null) {
                throw(err);
            }

            _.each(files, function(file) {
                var file_split = file.split(".")
                  , name = file_split[file_split.length - 3]
                  , view_index = views.indexOf(name);

                if (app._rocket_routes.indexOf(name) !== -1) {
                    throw("Route already in use");
                }

                if (file_split[file_split.length - 2] !== 'controller') {
                    return;
                }

                // Build a wrapper to prefill the view                                
                if (view_index != -1) {
                    var wrapped_funcs = {}
                      , view = views[view_index]
                      , cont_export = require(dir + '/controllers/' + view + '.controller.js')
                      , cont_keys = _.keys(cont_export)
                      , view_tmpls = fs.readdirSync(dir + '/views/' + view)

                    _.each(view_tmpls, function(view_tmpl) {
                        var tmpl_split = view_tmpl.split(".")
                          , tmpl_name = tmpl_split[tmpl_split.length - 3];

                        if(tmpl_split[tmpl_split.length - 2] != 'view') {
                            return;
                        }

                        if(cont_keys.indexOf(tmpl_name) != -1) {                     
                            wrapped_funcs[tmpl_name] = (function(dir, view, name, tmpl_name, cont_export) {
                                    return function(req, res) {                   
                                        var json = require(dir + '/controllers/' + view + '.controller.js')[tmpl_name]();
                                        res.render(dir  + '/views/' + name + '/' + view_tmpl, _.extend(json, {controller: name}));
                                    }
                            })(dir, view, name, tmpl_name, cont_export);
                        }
                    });

                } else {
                    // Go here if the Controller has no View              
                    var control = require(dir + '/controllers/' + file)
                      , funcs = _.functions(control)
                      , wrapped_funcs = {};                        
                    for(var i = 0; i < funcs.length; i++) {
                        wrapped_funcs[funcs[i]] = (function(i, funcs, control) {
                            return function (req, res) {
                              console.log("Here. !");
                                var ret = control[funcs[i]](req, res);
                                if(ret != undefined && ret != null){
                                    res.send(ret);
                                }
                            }
                        })(i, funcs, control)
                    }
                }
                
                console.log(require('util').inspect(wrapped_funcs));

                if (name === 'root') {
                    app.resource(wrapped_funcs);
                } else {
                    app.resource(name, wrapped_funcs);
                }

                app._rocket_routes.push(name);
            });

            call(app);                
        });
    };

    this.getViewFolders = function(dir) {
        if dir.length == 0 {
            callback(app);
        }

        var that = this;
        fs.readdir(dir + '/views/', function(err, view_folders) {
            if (err !== null) {
                throw(err);
            }

            that.set(view_folders, function(app) {
                this.getViewFolders(dir.shift())
            });
        });
    }

    this.getViewFolders(dir);
}

