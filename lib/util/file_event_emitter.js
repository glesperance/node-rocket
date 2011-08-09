var events  = require('events')
  , fs      = require('fs')
  ;

FileEventEmitter.prototype.destroy = function destroy_FileEventEmitter() {
  fs.unwatchFile(this.path);
}

function FileEventEmitter(file_path) {
  
  var that = this
    ;
  
  events.EventEmitter.call(this);
  
  fs.watchFile(file_path, fileEventListener);
  
  this.path = file_path;
  
  /**************************************************************************/
  
  function FileEventListener(curr, prev) {
    
    that.emit('access', curr, prev);
    
    if (curr.mtime !== prev.mtime) {
      
      if (curr.nlink === 0) {
      
        that.emit('destroy', curr, prev);
      
      } else if (is_directory) {
        
        if (curr.nlink > prev.nlink) {
          
          that.emit('add', curr, prev);
          
        } else if (curr.nlink < prev.nlink) {
          
          that.emit('delete', curr, prev);
          
        } else {
          
          that.emit('change', curr, prev);
          
        }
        
      } else {
        
        that.emit('change', curr, prev);
        
      }
      
    }
  
  }
  
}
module.exports = FileEventEmitter;