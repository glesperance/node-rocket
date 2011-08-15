var express = require('express')
  ;

var asyncFs = require('../utils/async_fs')
  , config  = require('../config')
  ;

function optimizeModule() {
  
  var args      = Array.prototype.slice.call(arguments)
    
    , file      = args.shift()
    
    , callback  = args.pop()
    
    ;
  
  file.on('change', function(curr, prev) {
    
  });
  
  file.on('destroy', function(curr, prev) {
    
  });
  
  
  
}

/******************************************************************************
 * Setups the client related resources. 
 *
 * It 
 *    * sets up a static middleware to serve the webapp `client/static` folder 
 *    as `/static`
 *    
 *    * sets up a static middleware to serve the rocket `rocket-js` folder
 *    as `/rocket-js`
 *    
 *    * sets up a static middleware to serve the webapp `client/js` folder as
 *    `/js` (except when in production) 
 *    
 * Moreover, when in production
 * it
 * 
 *    * optimizes -- with requireJS' `r.js` -- the modules at the root of 
 *    `client/js` by packing it with all its dependencies and then uglifying it.
 *    
 *    * serves those modules via a static middleware as `/js`
 *    
 * 
 * Finally, rocket watches the webapp `client/js` directory and updates its
 * related resources accordingly when new files are found or changes committed.
 * 
 * @param app {Object} The app object as returned by express, connect, or
 * rocket.
 * 
 * @param client {Object} The FileEventEmitter object of the `client`
 * folder.
 *                        
 * @param callback {Function} A callback of the form `function(err)`
 */
exports.setup = function setup_client() {
  
  var args      = Array.prototype.slice.call(arguments)
    
    , app       = args.shift()
    , client    = args.shift()
    
    , callback  = args.pop()
    ;
  
  if (process.env['NODE_ENV'] === 'production') {
    
    asyncFs.mapDir(
        
        client.path
        
      , [/[a-zA-Z0-9-_.]+\.js$/, optimizeModule]
        
      , callback
      
    );  
    
  } else {
    
    app.use('/static', express.static(path.join(client.path, CLIENT_STATIC_DIR)));
    
  }
  
}