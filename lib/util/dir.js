/******************************************************************************
 * Module dependencies
 */
var async = require('async')
  , fs    = require('fs')
  ;

/******************************************************************************
 * Reads the content of the directory specified by `path` and applies `iterator`
 * to each file.
 * 
 * @param path The path of the directory.
 * @param iterator An iterator function of the form `function(file, callback)`
 * @param callback A callback of the form `function(err)`.
 */
exports.forEach = function iterate_dir(path, iterator, callback) {
  
  async.waterfall(
      
      async.apply(fs.readdir, path)
      
    , function (files, callback) {
        
        async.forEach(files, iterator, callback);
      
      } 
      
      , callback
  );
  
}

/******************************************************************************
 * Reads the content of the directory specified by `path` and applies `iterator`
 * to each file in series. 
 * 
 * The next iterator is only called once the current one has completed.
 * 
 * @param path The path of the directory.
 * @param iterator An iterator function of the form `function(file, callback)`
 * @param callback A callback of the form `function(err)`.
 */
exports.forEachSeries = function iterate_dir(path, iterator, callback) {
  
  async.waterfall(
      
      async.apply(fs.readdir, path)
      
    , function (files, callback) {
        
        async.forEachSeries(files, iterator, callback);
      
      } 
      
      , callback
  );
  
}