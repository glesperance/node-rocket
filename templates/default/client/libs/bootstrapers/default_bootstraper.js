function dnodeReceiver(remote){
	console.log("--- Connected to server.");
	
	setInterval(3000, function(){ 
		console.log("<<< Ping!");
		remote.ping.sendPing("Ping!", function pongReceiver(msg){
			console.log(">>> " + msg);
		});
	});
}

exports.bootstrap = function() {
	var dnode = require("dnode");
	
	console.log("--- Default bootstraper here !");
	console.log("--- connecting to dnode server !");
	
	dnode.connect(dnodeReceiver);
	
}