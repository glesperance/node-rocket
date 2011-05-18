var BaseResource = require('base_resource');
var deepExtends = require('../libs/deepExtends').deepExtends;

var CouchDBResource;
var _prototype = {};

/******************************************************************************
 * Design Document
 */

_prototype.ddoc = {

};

/******************************************************************************
 * DB/Table Initialization Routine.
 */
 
_prototype.initialize = function() {
 
};

/******************************************************************************
 * Constructor & prototype hooking
 */
 
CouchDBResource = function() {
  //Call parent constructor
  this.__super__.constructor.apply(this, arguments);  
  
};

CouchDBResource.prototype = _prototype;

/*****************************************************************************/

exports.CouchDBResource = (function(){
  deepExtends(CouchDBResource, BaseResource);
  return CouchDBResource;
})();