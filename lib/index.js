var fs            = require('fs')
  , path          = require('path')
  ;

var pkg_json_path = path.join(__dirname, '..', 'package.json')
  , pkg_json     = fs.readFileSync(pkg_json_path, 'utf8')
  , pkg_json_info = JSON.parse(pkg_json)
  ;

module.exports = {
    version       : pkg_json_info.version
  , util          : require('./util')
  , createServer  : require('./loader').createServer
};