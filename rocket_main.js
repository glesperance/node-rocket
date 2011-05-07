
var fs = require("fs")
  , _ = require("underscore");


exports.setupControllers = function (app, dir, callback) {

    this.set = function(views) {

        fs.readdir(dir + '/controllers/', function(err, files) {
            if (err !== null) {
            	throw(err);
                //callback(err, app);
                return
            }

            _.each(files, function(file) {
                var file_split = file.split(".")
                  , name = file_split[file_split.length - 3]
                  , view_index = views.indexOf(name);

                if (file_split[file_split.length - 2] !== 'controller') {
                    return;
                }

                // Build a wrapper to prefill the view                                
                if (view_index != -1) {
                    var new_func = {}
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
                            new_func[tmpl_name] = (function(dir, view, name, tmpl_name, cont_export) {
                                    return function(req, res) {                   
                                        var json = require(dir + '/controllers/' + view + '.controller.js')[tmpl_name]();
                                        res.send(app.render(dir  + '/views/' + name + '/' + view_tmpl, json));
                                    }
                            })(dir, view, name, tmpl_name, cont_export);
                        }
                    });

                    app.resource(name, new_cont);
                } else {
                    // Go here if the Controller has no View              
                    var control = require(dir + '/controllers/' + file)
                      , funcs = _.functions(control)
                      , new_func = {};                        
                    for(var i = 0; i < funcs.len; i++) {
                        new_funcs[funcs[i]] = (funtion(i, funcs, control) {
                            return function (req, res) {
                                var ret = control[funcs[i]](req, res);
                                if(ret != undefined && ret != null){
                                    res.send(ret);
                                }
                            }
                        })(i, funcs, control)
                    }
                }


                if (name === 'root') {                      
                    app.resource(new_func);
                } else {
                    app.resource(name, new_func);
                }
            });

            callback(null, app);                
        });
    };

    this.getViewFolders = function() {
    	var that = this;
        fs.readdir(dir + '/views/', function(err, view_folders) {
            if (err !== null) {
            	throw(err);
               //callback(err, app);
                return;
            }

            that.set(view_folders);
        });
    }

    this.getViewFolders();
}

