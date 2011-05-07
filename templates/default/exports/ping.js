exports.sendPing(msg, cb){
	console.log(">>> " + msg);
	console.log("--- Ponging Client.");
	cb("Pong!");
}