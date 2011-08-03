/******************************************************************************
 * Module dependencies.
 */
 
//external dependencies
var rocket            = require('rocket')
  , Schema            = rocket.Schema
  ;

/******************************************************************************
 * Schema
 */
var schema = Schema({});

/*****************************************************************************/
module.exports = rocket.model('explicit_doc_name', schema);
