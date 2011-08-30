module.exports = function(remote, conn) {
  
  this.msg = 'hello world';
  
  this.ping = function(cb) { cb('pong'); }
  
}