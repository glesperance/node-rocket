
module.exports = new function() {
    
  this.MODELS_DIR_NAME              = 'models';
  this.VIEWS_DIR_NAME               = 'views';
  this.CONTROLLERS_DIR_NAME         = 'controllers';
  this.PLUGINS_DIR_NAME             = 'plugins';
  this.EXPORT_DIR_NAME              = 'exports';
  this.CLIENT_DIR_NAME              = 'client';
    
  /* client specific dirs */
  this.CLIENT_JS_DIR_NAME           = 'js';
  this.CLIENT_STATIC_DIR_NAME       = 'static';
  this.CLIENT_CSS_DIR_NAME          = 'css';
  
  this.REQUIRE_JS_CONFIG_FILE_NAME  = "require.config.json"
  
  /* namespace constants */
  this.CONTROLLER_SUFFIX            = '_controller';
  
  /* RESTful methods names */
  this.RESTFUL_METHODS              = [
                                        'index'
                                      , 'show'
                                      , 'new'
                                      , 'create'
                                      , 'edit'
                                      , 'update'
                                      , 'destroy'
                                      ];

  this.NAMESPACE                    = 'rocket';
  
  this.MODULE_NAME_REGEXP           = '([a-zA-Z][a-zA-Z0-9]*(_[a-zA-Z0-9]+)*)';
  
  this.VIEW_FILE_REGEXP             = new RegExp(
                                          [ this.MODULE_NAME_REGEXP
                                          , '\.([a-zA-Z]+)' 
                                          ].join('')
                                      );
  
  this.CONTROLLER_NAME_REGEXP       = new RegExp(
                                          [ this.MODULE_NAME_REGEXP
                                          , this.CONTROLLER_SUFFIX
                                          ].join('')
                                        );
  
  this.EXPORTS_NAME_REGEXP          = new RegExp(this.MODULE_NAME_REGEXP);


};