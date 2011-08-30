 var rocket = require("rocket")
   ;
 
/*****************************************************************************/
/* CONSTANTS
 */
var LISTEN_PORT = 3000
  ;

/*****************************************************************************/
/* MAIN
 */

rocket.createServer(
    
    //passes the current app directory to createServer()
    __dirname
  
    //adds some useful middlewares
    , [ 
        rocket.bodyParser()
      , rocket.cookieParser()
      ]
    
  , function(err, app) {
      
      if (err) { throw(err); return; }
      
      //starts the server
      app.listen(LISTEN_PORT);
      
    }

);

/***********/

