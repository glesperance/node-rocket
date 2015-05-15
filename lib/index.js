var fs            = require('fs')
  , path          = require('path')
  , oo            = require('oo')
  , express       = require('express')
  ;

var pkg_json_path = path.join(__dirname, '..', 'package.json')
  , pkg_json     = fs.readFileSync(pkg_json_path, 'utf8')
  , pkg_json_info = JSON.parse(pkg_json)
  ;

module.exports = oo.extend({
    version       : pkg_json_info.version
  , util          : require('./util')
  , createServer  : require('./loader').createServer
  , build         : require('./loader').build
  , i18n          : require('./locale').i18n
  , _             : require('./locale')._
}, express);