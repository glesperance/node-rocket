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
          
          context.curr  = cont_args[0];
          context.prev  = cont_args[1];
          
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
 * @param iterator An iterator function of the form `function(file, callback)`.
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

/******************************************************************************
 * Reads the specified directory and iterates through its children files and 
 * applies the iterator if the filename matched the associated filter.
 * 
 * Also watches the directory for new files and applies the iterators according
 * to the filters to any new found file.
 * 
 * @param dir_path {String} The path of the directory on which to apply this
 * function.
 * 
 * @param filters {Array} An array representing a 2-tuple of 
 * `[filter, continuation]` 
 * 
 *    where 
 *    
 *      * `filter` is either a {RegExp} or a {String} representing a {RegExp}
 *                          
 *      * `continuation` is a {Function} of the form 
 *          
 *          `function(file_events, matches, callback)` where
 *          
 *          ** `file_event` is a {FileEventEmitter} of the selected file.
 *          
 *          ** `matches` is an {Array} of the matched patterns of the RegExp selecting
 *          file. 
 *          
 *          ** `callback` is an optional {Function} pointed to the passed 
 *          callback.
 * 
 * @param callback {Function} A callback of the form `function(err)`
 */
exports.mapDir() {
  
  var args = Array.prototype.slice(arguments)
    
    , dir_path  = args.shift()
    , filters   = (Array.isArray(args[0]) ? args.shift() : [args.shift()])
    , callback  = args.pop()
    
    , emitter   = new FileEventEmitter(dir_path)
    , snapshot
    ;
  
  async.waterfall(
    
      async.apply(fs.readdir, dir_path)
    
    , function (files, callback) {
      
        snapshot = files;
        
        async.forEach(files, iterator, callback);
    
      } 
    
    , callback
    
  );
  
  emitter.on('add', function(curr, prev) {

    var nlink_diff = curr.nlink - prev
      , diff       = []
      ;
    
    async.waterfall(
    
        async.apply(fs.readdir, dir_path) 
    
      , function(files, callback) {
          
          for (var file in files) {
            
            if (! file in snapshot) {
             
              diff.push(file);
              
              if (--nlink_diff > 0) { 
              
                continue; 
              
              } else { 
                
                break; 
                
              }
              
            }
            
          }
          
          snapshot = files;
          
          async.forEach(diff, iterator, callback);
          
        }
        
      , function(err) { 
        
          if (err) { 
            
            throw err; 
            
          } 
      
        }
      
    );
  
  });
  
  return emitter;
  
  /*************************************************************************/
  
  function iterator(filename, callback) {
    
    var diff;
    
    async.forEach(
      
        filters
      
      , function(filter, callback) {
          
          var regexp        = (filter[0] instanceof RegExp ? filter[0] : new RegExp(filter));
            , matches       = regexp.exec(filename)
            , continuation  = filter[1]
            
            , file_path     = path.join(dir_path, filename)
            , emitter
            ;
            
          if (matches) {
            
            emitter = new FileEventEmitter(file_path);
            
            continuation(emitter, matches, callback);
            
          }
          
        }
      
      , callback
    );
    
  }
  
}