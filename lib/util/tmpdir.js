var fs      = require('fs')
  , path    = require('path')
  ;

var TMPDIR  = process.env['TMPDIR'] || '/tmp'
  , PID     = process.pid
  ;

/******************************************************************************
 * Initialization
 */
var proc_tmpdir_path = path.join(TMPDIR, PID)
  ;

//clears the process tmpdir if it already exists
fs.rmdirSync(proc_tmpdir_path);

//creates a new process tmpdir 
fs.mkdirSync(proc_tmpdir_path);

//exports the proc_tmpdir_path
exports.path = proc_tmpdir_path;

/******************************************************************************
 * Clears the process tmpdir by removing it and re-creating it.
 * 
 * @param callback {function} A callback of the form `function(err)`
 */
exports.clear = function clear_tmpdir(callback) {

  fs.rmdir(proc_tmpdir_path, function(err) {
    
    if (err) { 
      
      callback(err);
      
    } else {
     
      fs.mkdir(proc_tmpdir_path, callback);
      
    }
  
  });

}
