var CouchDBResource = require('rocket').resources.CouchDBResource;

var oo = require('rocket').utils.oo;
/*****************************************************************************/
/* Connection option
 */

AlphaOptin.connection = {
  options: {
    auth: {
        username: 'admin'
      , password: 'apres_moi_le_deluge'
    }
  }
}

/*****************************************************************************/
/* CouchDBResource's Constructor
 */
function AlphaOptin() {

}

AlphaOptin.type = 'AlphaOptin';

oo.inherits(AlphaOptin, CouchDBResource);

//export the object
module.exports = AlphaOptin;