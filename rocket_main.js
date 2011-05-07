var RocketMain = {

    setUpControllers: function (app, dir, callback) {

        this.set = function(views) {

            fs.readdir(dir + 'controllers', function(err, files) {
                if (err !== null) {
                    callback(err, app);
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
                        var new_cont = {}
                          , view = views[view_index]
                          , cont_export = require(dir + 'controllers/' + view + '.controller.js')
                          , cont_keys = _.keys(cont_export)
                          , view_tmpls = fs.readdirSync(dir + 'views/' + view)

                        _.each(view_tmpls, function(view_tmpl) {
                            var tmpl_split = view_tmpl.split(".")
                              , tmpl_name = tmpl_split[tmpl_split.length - 3];

                            if(tmpl_split[tmpl_split.length - 2] != 'view') {
                                return;
                            }

                            if(cont_keys.indexOf(tmpl_name) != -1) {                     
                                new_cont[tmpl_name] = (function(dir, view, name, tmpl_name, cont_export) {
                                        return function(req, res) {                   
                                            var json = require(dir + 'controllers/' + view + '.controller.js')[tmpl_name]();
                                            res.send(app.render(dir  + 'views/' + name + '/' + view_tmpl, json));
                                        }
                                })(dir, view, name, tmpl_name, cont_export);
                            }
                        });

                        app.resource(name, new_cont);
                    } else {
                        // Go here if the Controller has no View              
                        if (name === 'root') {
                            app.resource(require(dir + 'controllers/' + file));
                        } else {
                            app.resource(name, require(dir + 'controllers/' + file));
                        }
                    }
                })

                callback(null, app);                
            });
        };

        this.getViewFolders = function() {
            fs.readdir(dir + 'views', function(err, view_folders) {
                if (err !== null) {
                    callback(err, app);
                    return;
                }

                this.set(view_folders);
            });
        }

        this.getViewFolders();
    }
}

exports.setUpControllers = RocketMain.setUpControllers;
