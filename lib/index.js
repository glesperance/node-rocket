var pkg_json_path = path.join(__dirname, .., 'package.json')
  , pckg_json     = fs.readFileSync(pkg_json_path), 'utf8')
  , pkg_json_info = JSON.parse(package_JSON)
  ;

module.exports = {
    version       : pkg_json_info.version
  , util          : require('./util')
  , createServer  : require('./loader').createServer
};