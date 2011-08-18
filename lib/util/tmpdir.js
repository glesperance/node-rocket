var fs      = require('fs')
  , path    = require('path')
  , rimraf  = require('rimraf')
  ;

var TMPDIR  = process.env['TMPDIR'] || '/tmp'
  , PID     = process.pid
  , MODE    = 0750
  ;

var counter = 0
  ;

/******************************************************************************
 * Initialization
 */
var proc_tmpdir_path = path.join(TMPDIR,  '' + PID)
  ;

//clears the process tmpdir if it already exists
try { 
  
  rimraf.sync(proc_tmpdir_path);

} catch(err) {
  
  if (err.code !== 'ENOENT') {
    
    throw err;
    
  }
  
}

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
  
  if (typeof id === 'undefined') {
    
    throw 'ChildTmpdir needs a defined id';
    
  }
  
  this.id = id;
  this.path = path.join(proc_tmpdir_path, '' + id);

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
 * to 0750 or [drwxr-x---]
 * 
 * @returns {String} The id of the created unique directory.
 */
function mkuniqueSync_tmpdir(mode) {
  
  var id              = counter++
    , unique_dir_path = path.join(proc_tmpdir_path, '' + id)
    ;
  
  mode = mode || MODE
  
  
  
  fs.mkdirSync(unique_dir_path, MODE);
  
  return new ChildTmpdir(id);
  
}
exports.mkuniqueSync = mkuniqueSync_tmpdir;

/******************************************************************************
 * Clears the process tmpdir by removing it and re-creating it.
 * 
 * @param callback {function} A callback of the form `function(err)`
 */
function clear_tmpdir() {

  var args      = Array.prototype.slice.call(arguments)
    
    , callback  = args.pop()
    
    , dir_id    = (typeof args[0] === 'undefined' ? '' : args.shift())
    
    , dir_path  = path.join(proc_tmpdir_path, '' + dir_id)
    ;
  
  rimraf(dir_path, function(err) {
    
    if (err) { 
      
      callback(err);
      
    } else {
     
      fs.mkdir(dir_path, MODE, callback);
      
    }
  
  });

}
exports.clear = clear_tmpdir;