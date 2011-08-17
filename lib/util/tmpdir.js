var fs      = require('fs')
  , path    = require('path')
  ;

var TMPDIR  = process.env['TMPDIR'] || '/tmp'
  , PID     = process.pid
  , MODE    = 755
  ;

var counter = 0
  ;

/******************************************************************************
 * Initialization
 */
var proc_tmpdir_path = path.join(TMPDIR, PID)
  ;

//clears the process tmpdir if it already exists
fs.rmdirSync(proc_tmpdir_path);

//creates a new process tmpdir 
fs.mkdirSync(proc_tmpdir_path, MODE);

//exports the proc_tmpdir_path
exports.path = proc_tmpdir_path;


/******************************************************************************
 * ChildTmpdir constructor
 * 
 * @param id {Number} The id of the ChildTmpdir 
 */
function ChildTmpdir(id) {
  
  this.id = id;
  this.path = path.join(proc_tmpdir_path, id);

}

/**
 * Clears the tmpdir by removing it and re-creating it.
 * 
 * @param callback {function} A callback of the form `function(err)`
 */
ChildTmpdir.prototype.clear = function(callback) {
  
  return clear_tmpdir(this.id, callback);
  
}

/******************************************************************************
 * Makes a unique directory in the current process' tmpdir and returns its
 * path.
 * 
 * @param mode {Number} (optional) The mode of the wanted directory. Defaults
 * to 755 or [drwxr-xr-x]
 * 
 * @returns {String} The id of the created unique directory.
 */
exports.mkuniqueSync(mode) {
  
  var id              = counter++
    , unique_dir_path = path.join(proc_tmpdir_path, id)
    ;
  
  mode = mode || MODE
  
  fs.mkkdirSync(unique_dir_path, MODE);
  
  return new ChildTmpdir(id);
  
}

/******************************************************************************
 * Clears the process tmpdir by removing it and re-creating it.
 * 
 * @param callback {function} A callback of the form `function(err)`
 */
exports.clear = function clear_tmpdir() {

  var args      = Array.prototype.slice.call(arguments)
    
    , callback  = args.pop()
    
    , dir_id    = args.shift() || ''
    
    , dir_path  = path.join(proc_tmpdir_path, dir_id)
    ;
  
  fs.rmdir(dir_path, function(err) {
    
    if (err) { 
      
      callback(err);
      
    } else {
     
      fs.mkdir(dir_path, MODE, callback);
      
    }
  
  });

}
