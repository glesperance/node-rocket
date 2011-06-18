 var rocket = require("rocket");
 
/*****************************************************************************/
/* CONSTANTS
 */

var LISTEN_PORT = 3000;

/*****************************************************************************/
/* MAIN
 */
var app = rocket.createServer(__dirname);
app.listen(LISTEN_PORT);

/***********/

