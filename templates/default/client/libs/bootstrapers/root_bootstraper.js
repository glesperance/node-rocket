var default_bootstraper = require("./base_bootstraper");

exports.bootstrap = function() {
	console.log("--- In root_bootstraper ! Hello world !");
	default_bootstraper.bootstrap();
}