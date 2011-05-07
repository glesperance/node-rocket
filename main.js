require("coffee-script");

exports.constructServer = function(config){
	
	var app = require("./libs/app");
	var myApp = new app.App(config);
	
	return myApp;
}

