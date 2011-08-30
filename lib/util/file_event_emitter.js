var events  = require('events')
  , fs      = require('fs')
  ;

var cache = [];

//Inherits the prototype from `events.EventEmitter`
FileEventEmitter.prototype = Object.create(events.EventEmitter.prototype);

/*******************************************************************************
 * Destroys the FileEventEmmitter instance and stops watching the file.
 */
FileEventEmitter.prototype.unwatch = function unwatch_FileEventEmitter() {
  fs.unwatchFile(this.path);
}

/******************************************************************************
 * FileEventEmitter constructor
 * 
 * Watches the specified file and emit events such that:
 * 
 *  * it emits a `access` event when the file is accessed
 *  * it emits a `destroy` event when the file is deleted
 *  * it emits a `change` event when the file is modified
 *  
 * If the watched file is a directory FileEventEmitter emits events such that:
 * 
 *  * it emits a `add` event when a file is added to the directory
 *  * it emits a `delete` event when a file deleted from the directory 
 * 
 * @extends events.EventEmitter
 * 
 * @param file_path {String} The path of the file we want to watch.
 * @api public
 */
function FileEventEmitter(file_path) {
  
  var that          = this
    ;
  
  if (cache[file_path]) {
    
    return cache[file_path];
    
  }
  
  events.EventEmitter.call(this);
  
  fs.watchFile(file_path, fileEventListener);
  
  this.path = file_path;
  
  cache[file_path] = this;
  
  /**************************************************************************/
  
  function fileEventListener(curr, prev) {
    
    that.emit('access', curr, prev);
      
    if (curr.nlink === 0) {
    
      that.emit('destroy', curr, prev);
      
    }
    
    if (+curr.mtime != +prev.mtime) {  
      
      if (curr.isDirectory() && prev.isDirectory()) {
        
        if (curr.nlink > prev.nlink) {
          
          that.emit('add', curr, prev);
          
        } else if (curr.nlink < prev.nlink) {
          
          that.emit('delete', curr, prev);
          
        }
         
      }
      
      that.emit('change', curr, prev);
    
    }
  
  }
  
}
module.exports = FileEventEmitter;