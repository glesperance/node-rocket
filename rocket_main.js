
exports.setupControllers = require("./libs/controllers").setupControllers;

exports.resources = {
    CouchdbResource: require("./libs/couchdb_resource")
  , BaseResource: require("./libs/base_resource");
};

