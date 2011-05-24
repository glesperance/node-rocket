function dnodeReceiver(remote){
	console.log("--- Connected to server.");
	
	setInterval(function(){ 
		console.log("<<< Ping!");
		document.getElementById("console").innerHTML += "<<< Ping!\n";
		remote.ping.sendPing("Ping!", function pongReceiver(msg){
			console.log(">>> " + msg);
			document.getElementById("console").innerHTML += ">>>" + msg +"!\n\n";
		});
	}, 3000);
}

exports.bootstrap = function(){
	var dnode = require("dnode");
	
	console.log("--- connecting to server.");
	dnode.connect(dnodeReceiver);
}