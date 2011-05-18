var default_controller = require("./default_bootstrapper");

exports.bootstrap = function() {
	console.log("--- In root_bootstraper ! Hello world !");
	default_controller.bootstrap();
}