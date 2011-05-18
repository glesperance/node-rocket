var resourcer = require('resourcer');

var _ = require('underscore');
var deepExtend = require('../utils/deep-extend').deepExtend;

var BaseModel;
var _prototype = {};

/******************************************************************************
 * Prototype functions
 */
 
_prototype.property;

_prototype.create;

_prototype.read;

_prototype.update;

_prototype.destroy;


/******************************************************************************
 * Constructor
 */
BaseModel = function(modelDef) {
}

BaseModel.prototype = _prototype;

/*****************************************************************************/

exports.BaseModel = (function(){ return BaseModel; })();