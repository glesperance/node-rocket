var fs        = require("fs")
  , _         = require("underscore")
  , express   = require("express")
  , Resource  = require("express-resource")
  , dnode     = require("dnode")
  , colors    = require('colors')
  , path      = require('path')
  , lingo     = require('lingo')
  , async     = require('async')
  ;
  
var extractName = require('./libs/utils/namespace').extractName
  , checkName = require('./libs/utils/namespace').checkName
  , oo = require('./libs/utils/oo')
  , views_filters = require('./libs/views/filters')
  ;
  
/******************************************************************************
 * GLOBALS
 */
 
var missing = [];
    
/******************************************************************************
 * Models Setup
 */  
function setupModels(app) {
  
  var models_files = fs.readdirSync(path.join(app.rocket.app_dir, MODELS_DIR_NAME))
    ;
  
  async.forEachSeries(
    
      models_files
  
    , function(current_file, callback){
      
      if (current_file === DATASOURCES_DIR_NAME || current_file === 'empty') {
        
        callback(null); return;
      
      }
      
      var model_name = extractName(current_file.toLowerCase(), {extension: true, suffix: '_document'})
        , model_defn = require(path.join(app.rocket.app_dir, MODELS_DIR_NAME, current_file))
        ;
      
      if (!lingo.en.isSingular(model_name)) {
      
        callback('xxx ERROR model doc_type must be singular [' + model_name + ']');
      
      }
      
      Models.model(model_name, model_defn, callback);
    
    }
    
  , function(err) {
      
      if (err) {
      
        console.log(err); 
        throw err; 
    
      } 
    
    }
  
  );

}

/******************************************************************************
 * Compile exports
 */ 
function compileExports(app) {
  var dirs
    , plugins
    , exported_dirs = {'': path.join(app.rocket.app_dir, EXPORT_DIR_NAME)}
    , myExports = {};
  
  // Add plugin exports to EXPORT_DIRS
  if(missing.indexOf(PLUGINS_DIR_NAME) === -1){
    try{
      plugins = fs.readdirSync(path.join(app.rocket.app_dir, PLUGINS_DIR_NAME));
      for(var i = 0; i < plugins.length; i++) {
        exported_dirs[plugins[i]] = path.join(app.rocket.app_dir, PLUGINS_DIR_NAME, plugins[i], EXPORT_DIR_NAME);
      }
    }catch(err){
      if(err.code == 'ENOENT') {
            console.log('!!! WARNING No `plugins` dir found in project. Skipping plugin exports...'.yellow);
            missing.push(PLUGINS_DIR_NAME);
      }else{
        throw err;
      }
    }
  }
  
  for(var export_name in exported_dirs) {
    var container;
    if(export_name === 'empty') {
      continue;
    }else if(export_name === '') {
      container = myExports;
    }else{
      myExports[export_name] = {};
      container = myExports[export_name];
    }
    
    try{
      dirs = fs.readdirSync(exported_dirs[export_name]); 
    
      for (var j = 0; j < dirs.length; j++) {
        var objName = dirs[j].split(".")[0]
          , obj = require(path.join(exported_dirs[export_name], dirs[j]));
    
          container[objName] = obj;
      }      
    }catch(err){
      if(err.code === 'ENOENT') {
        console.log('!!! WARNING No `exports` dir found in project. Skipping exports...'.yellow);
        missing.push(EXPORT_DIR_NAME);
      }else{
        throw err;
      }
    }
  }
  
  if(myExports !== {}) {
    app.rocket.dnode = dnode(function(remote, conn) {
      for(var k in myExports){
    	var v    = myExports[k]
    	  ;

    	if(typeof v === 'function') {
          this[k] = new v(remote,conn);
    	} else {
          this[k] = v;
    	}
      }
    });
  }
  
}