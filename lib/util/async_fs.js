/******************************************************************************
 * Module dependencies
 */
var async = require('async')
  , fs    = require('fs')
  ;

/******************************************************************************
 * Watch for changes on `filename`. The callback `listener` will be called with
 * the specified `arguments...` each time the file is *accessed*.
 *  
 * This function also returns a continuation function with the arguments 
 * already applied. 
 * 
 * Any arguments passed to the returned function are appended to the arguments
 * originally passed to apply.
 * 
 * Finally, when called by `fs.watchFile`, `prev` and `curr` can be
 * respectively accessed through `this.prev` and `this.curr`.
 * 
 * @param filename The filename of the file to watch. Support watching multiple
 *                 files by providing an array of filename.
 * 
 * @param listener The function you want to eventually apply all arguments to.
 * 
 * @param arguments... Any number of arguments to automatically apply when the
 *                     continuation is called.
 */
exports.applyAndWatchFile = function applyAndWatchFile() {
  
  var args = Array.prototype.slice.apply(arguments)
    
    , filename  = args.shift()
    , listener args.shift()
    
    , context = {}
    
    , continuation = function() {
        
        var cont_args   = Array.prototype.slice.apply(arguments)
          ;
        
        if 
        (   cont_args.length === 2
        &&  cont_args[0] instanceof fs.Stat
        &&  cont_args[1] instanceof fs.Stat
        ){
          
          context.curr  = cont_args[0]
          context.prev  = cont_args[1]
          
        } else {
        
          Array.prototype.unshift.apply(cont_args, args);
        
        }
        
        listener.apply(context, cont_args)
        
      }
    ;
  
  if (typeof filename === 'object'
  && Array.isArray(filename)
  ){
    
    async.forEach(
      
        filename
      
      , function(single_filename){ 
        
          continuation(single_filename, continuation);
        
        }
    
    );
    
  } else {
  
    fs.watchFile(filename, continuation);
  
  }
  
  return continuation;
  
}

/******************************************************************************
 * Reads the content of the directory specified by `path` and applies `iterator`
 * to each file.
 * 
 * @param path The path of the directory.
 * @param iterator An iterator function of the form `function(file, callback)`
 * @param callback A callback of the form `function(err)`.
 */
exports.forEachFile = function forEachFile(path, iterator, callback) {
  
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
exports.forEachFileSeries = function forEachFileSeries(path, iterator, callback) {
  
  async.waterfall(
      
      async.apply(fs.readdir, path)
      
    , function (files, callback) {
        
        async.forEachSeries(files, iterator, callback);
      
      } 
      
      , callback
  );
  
}