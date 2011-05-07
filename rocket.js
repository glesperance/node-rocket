process.title = "rocket"

if (require.main === module) {
  console.error(["It looks like you're doing 'node rocket.js'."
                ,"Don't do that.  Instead, run 'make install'"
                ,"and then use the 'rocket' command line utility."
                ].join("\n"))
  process.exit(1)
}

var rocket = {}
  , path = require("path")
  , abbrev = require("abbrev")
  , semver = require("semver")
  fs = require("./libs/utils/graceful-fs")

try {
  // startup, ok to do this synchronously
  var j = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"))+"")
  rocket.version = j.version
  rocket.nodeVersionRequired = j.engines.node
  if (!semver.satisfies(process.version, j.engines.node)) {
    log.error([""
              ,"rocket requires node version: "+j.engines.node
              ,"And you have: "+process.version
              ,"which is not satisfactory."
              ,""
              ,"Bad things will likely happen.  You have been warned."
              ,""].join("\n"), "unsupported version")
  }
} catch (ex) {
  try {
    log(ex, "error reading version")
  } catch (er) {}
  rocket.version = ex
}

rocket.log = function (msg) {
  if (rocket.verbose) {
    console.log(msg);
  }
}

rocket.commands = {
  create: function () {
    if (rocket.argv.length < 1) {
      console.error("A project name is expected when creating a project.");
      process.exit(1);
    }
    console.log("This is creating project \"" + rocket.argv[0] + "\" in " + process.cwd());
  }
  , help: function () {
    console.log([
        "Usage: rocket [OPTIONS] ARGUMENTS\n" 
        , "Arguments:" 
        , "  create nameOfProject   create a rocket project" 
        , "Options:" 
        , "  -v, --verbose          show what's under the rocket." 
        , "  -h, --help             show this message." ].join("\n") );
  }
}

module.exports = rocket
