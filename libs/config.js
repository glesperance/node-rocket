var _ = require("underscore");

/**
 * Used to initialize the default config
 * with default, lazy variables.
 * 
 * @param parent The parent context of the variable. 
 * @param var_name The name of the variable
 * @param lazy_default a function to be called returning the "lazy"
 * value.
 */
function lazyDefault(parent, var_name, lazy_default){
	
	parent.__defineGetter__(
			var_name, 
			function(){
				if(parent["_" + var_name] != undefined){
					return parent["_" + var_name];
				}else{
					return lazy_default();
				}
			});
	
	parent.__defineSetter__(
			var_name,
			function(val){
				parent["_" + var_name] = val;
			}
			);
}

/**
 * Default Configuration Constructor.
 * @returns {default_config}
 */
function default_config(){
		
	/**
	 * Port for the Application Server to listen On.
	 */
	this.listen_port = 6544,
	
	/**
	 * Should the App be verbose...
	 */
	this.verbose = true,
	
	/**
	 * Name of the root view.
	 */
	this.root_view = "root",
	
	/**
	 * Directory names.
	 */
	this.dir_names = {
		templates: "templates",
		controllers: "controllers",
		static: "static"
	},
	
	this.template_engine  ="jade"
};

/**
 * Take the configuration object, and merge it with the
 * default one. 
 * 
 * New Values replace default ones.
 * 
 * @param path The path to the configuration file to
 * parse.
 */
default_config.prototype.load_config = function(config){
	_.extend(this, config);
};

exports.load_config = function(new_config){
	var conf = new default_config();
	conf.load_config(new_config)
	return conf;
};