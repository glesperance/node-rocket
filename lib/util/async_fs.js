/******************************************************************************
 * Module dependencies
 */
var async             = require('async')
  , fs                = require('fs')
  , path              = require('path')
  ;

var FileEventEmitter  = require('./file_Event_emitter')

/******************************************************************************
 * Traverses the directory defined by `dir_path` and recursively
 * watches for any addition, removal, or modification of files, emitting a
 * `change` event accordingly.
 * 
 * @param dir_path {String} The path of the root of the directory tree we want
 * to watch.
 * 
 * @returns {FileEventEmitter} the FileEventEmitter instance of the root
 * directory.
 *  
 */
exports.watchTree = function watchTree_asyncFs(dir_path) {
  
  var dir_event_emitter = new FileEventEmitter(dir_path)
    ;
  
  fs.readdir(path, function(err, files) {
  
    if (err) { 
      
      throw err;
      
    }
    
    async.forEach(
        
        files
        
      , function iterator(filename, callback) {
          
          var file_path = path.join(dir_path, filename)
            , emitter
            ;
          
          fs.stat(file_path, function(err, stats)Ê{
          
            if (err) {
              
              callback(err); 
              return; 
              
            }
            
            if (stats.isDirectory()) {
              
              emitter = watchTree_asyncFs(file_path);
              
            } else {
              
              emitter = new FileEventEmitter(file_path);
                            
            }
            
            emitter.on('change', function() {
              
              dir_event_emitter.emit('change');
              
            });
            
            emitter.on('destroy', function() {
              
              emitter.unwatch();
              
            });
            
            callback(null);
            
          });
          
        }
        
      , function callback(err) {
        
          if (err) { throw err; }
        
        }
        
    );
  
  })
  
  return dir_event_emitter;
  
}

/******************************************************************************
 * Test if the matched file is a directory. Meant to be used with mapDir as a
 * test passed to the iterator.
 * 
 * @param filename {String} The filename of the current file to test
 * @param file_path {String} The path of the current file to test
 * @param callback {Function} a function of the form `function(err, matches)` where
 *    
 *    * `err` is your usual calback error parameter
 *          
 *    * `matches` is a parameter, to be passed to `continuation`. An
 *    undefined `matches` argument means a negative match and thus tells
 *  
 *    * the iterator **not** to call the continuation.
 *
 */
exports.isDirTest = function isDirTest_asyncFs(filename, file_path, callback) {
  
  fs.Stat(file_path, function(err, stats) {
    
    if (err) { 
      
      callback(err); 
    
    } else {
      
      if (stats.isDirectory()) {
        
        callback(null, filename);
        
      } else {
        
        callback(null);
        
      }
      
    }
  
  });
  
}

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
  
  var args          = Array.prototype.slice.apply(arguments)
    
    , filename      = args.shift()
    , listener      = args.shift()
    
    , context       = {}
    
    , continuation  = function() {
        
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
 *      * `filter` is either a {RegExp}, a {String} representing a {RegExp} or
 *      a function of the form `function(filename, callback)` where
 *      
 *        * `filename` is the current filename to test
 *        
 *        * `file_path` is the path of the current file to test
 *       
 *        * `callback` is a function of the form `function(err, matches)` where
 *        
 *          * `err` is your usual calback error parameter
 *          
 *          * `matches` is a parameter, to be passed to `continuation`. An
 *          undefined `matches` argument means a negative match and thus tells
 *          the iterator **not** to call the continuation.
 *      
 *      Alternatively, this param can also be an array of `filter` defined as
 *      above.
 *                          
 *      * `continuation` is a {Function} of the form 
 *          
 *          `function(file_events, matches, callback)` where
 *          
 *          ** `file_event` is a {FileEventEmitter} of the selected file.
 *          
 *          ** `matches` is an {Array} of the matched patterns of the RegExp selecting
 *          file, or the value returned by the user supplied test.
 *          
 *          ** `callback` is an optional {Function} pointed to the passed 
 *          callback.
 * 
 * @param callback {Function} A callback of the form `function(err)`
 */
exports.mapDir = function mapDir() {
  
  var args = Array.prototype.slice.call(arguments)
    
    , dir_path  = args.shift()
    , filters   = (Array.isArray(args[0][0]) ? args.shift() : [args.shift()])
    , callback  = args.pop()
    
    , emitter   = new FileEventEmitter(dir_path)
    , snapshot
    ;
  
  async.waterfall(
      
      [
    
        async.apply(fs.readdir, dir_path)
      
      , function (files, callback) {
        
          snapshot = files;
          
          if (files) {
          
            async.forEach(files, iterator, callback);
            
          } else {
            
            callback(null);
            
          }
            
        } 
      ]
    
    , callback
    
  );
  
  emitter.on('change', function(curr, prev) {

    var nlink_diff = curr.nlink - prev
      , diff       = []
      ;
    
    if(curr.nlink < prev.nlink) { return; }
    
    async.waterfall(
        [
                       
          async.apply(fs.readdir, dir_path) 
      
        , function(files, callback) {
            
            for (var i = 0, ii = files.length; i < ii; i++) {
              
              var file = files[i];
              
              if (snapshot.indexOf(file) === -1) {
               
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
        ]
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
    
    async.forEach(
      
        filters
      
      , function(filter, callback) {
          
          var test
            , regexp
            , matches
            
            , continuation  = filter[1]
            
            , file_path     = path.join(dir_path, filename)
            , emitter
            ;
          
          if (typeof filter[0] === 'string') {
            
            regexp = new RegExp(filter[0]);
            matches       = regexp.exec(filename);
            
            checkAndContinue(null, matches);
            
          } else if (filter[0] instanceof RegExp) {
            
            matches = regexp.exec(filename);
            checkAndContinue(null, matches);
            
          } else {
            
            test = filter[0]
            matches = test(filename, file_path, checkAndContinue);
            
          }
          
          function checkAndContinue(err, matches) {
            
            if (err) {
             
              callback(err);
            
            } else if (matches) {
              
              emitter = new FileEventEmitter(file_path);
              
              continuation(emitter, matches, callback);
              
            } else {
              
              callback(null);
              
            }
          
          }
        
        }
        
      , callback
    );
    
  }
  
}