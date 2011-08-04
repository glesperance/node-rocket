module.exports = {
  
    MODELS_DIR_NAME             : 'models'
  , VIEWS_DIR_NAME              : 'views'
  , CONTROLLERS_DIR_NAME        : 'controllers'
  , PLUGINS_DIR_NAME            : 'plugins'
  , EXPORT_DIR_NAME             : 'exports'
  , CLIENT_DIR_NAME             : 'client'
    
  /* client specific dirs */
  , CLIENT_LIBS_DIR             : path.join(CLIENT_DIR_NAME, 'js')
  , CLIENT_STATIC_DIR           : path.join(CLIENT_DIR_NAME, 'static')
  
  /* namespace constants */
  , CONTROLLER_SUFFIX           : '_controller'
  
  /* RESTful methods names */
  , RESTFUL_METHODS             : [
                                    'index'
                                  , 'show'
                                  , 'new'
                                  , 'create'
                                  , 'edit'
                                  , 'update'
                                  , 'destroy'
                                  ]

  , NAMESPACE                   : 'rocket'
};