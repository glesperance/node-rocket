#!/usr/bin/env node

// Big thanks to NPM for its nice script.
;(function () { // wrapper in case we're in module_context mode
var path = require("path")
  , abbrev = require("abbrev")
  , semver = require("semver")
  , nopt = require("nopt")
  , fs = require("../libs/utils/graceful-fs")
  , knownOpts = { "help" : Boolean
                , "verbose" : Boolean
                , "version" : Boolean
                }
  , shortHands = { "h" : ["--help"]
                 , "v" : ["--verbose"]
                 }
  , parsed = nopt(knownOpts, shortHands, process.argv, 2)
  , argv= parsed.argv.remain
  , command= argv.shift()

var rocket = {
  command: command
, argv: argv
, verbose: parsed.verbose 
, error : function (msg) {
    console.error("Houston.. we have a problem: " + msg);
  }
, log : function (msg) {
    if (rocket.verbose) {
      console.log(msg);
    }
  }
}

try {
  var j = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"))+"")
  rocket.version = j.version
  rocket.nodeVersionRequired = j.engines.node
  if (!semver.satisfies(process.version, j.engines.node)) {
    rocket.error([""
               ,"rocket requires node version: "+j.engines.node
               ,"And you have: "+process.version
               ,"which is not satisfactory."
               ,""
               ,"Bad things will likely happen.  You have been warned."
               ,""
              ].join("\n"), "unsupported version")
  }
} catch (ex) {
  try {
    rocket.log(ex, "error reading version")
  } catch (er) {}
  rocket.version = ex
}

rocket.log("Running command: " + rocket.command);

if (parsed.version) {
  console.log(rocket.version)
  return
} else {
  rocket.log("rocket@"+rocket.version, "using")
}

rocket.log("node@"+process.version, "using");

// make sure that this version of node works with this version of rocket.
var nodeVer = process.version
  , reqVer = rocket.nodeVersionRequired

if (reqVer && !semver.satisfies(nodeVer, reqVer)) {
  rocket.error("rocket doesn't work with node " + nodeVer + "\nRequired: node@" + reqVer)
  return
}

if (parsed.help && rocket.command !== "help") {
  rocket.argv.unshift(rocket.command)
  rocket.command = "help"
}

rocket.commands = {
  create: function () {
    if (rocket.argv.length < 1) {
      rocket.error("A project name is expected when creating a project.");
      process.exit(1);
    }
console.log(path.join(process.cwd(), rocket.argv[0]));
    if (path.existsSync(path.join(process.cwd(), rocket.argv[0]))) {
      rocket.error("The project directory (" + path.join(process.cwd(), rocket.argv[0]) + ") already exists.");
      process.exit(1);
    } else {
      console.log("This is creating project \"" + rocket.argv[0] + "\" in " + process.cwd());
      require('child_process').spawn('cp', ['-r', path.join(__dirname, "../templates/default"), path.join(process.cwd(), rocket.argv[0])]);
    }
  }
  , help: function () {
    console.log([
        "Usage: rocket [OPTIONS] ARGUMENTS\n" 
        , "Arguments:" 
        , "  create nameOfProject    create a rocket project" 
        , "Options:" 
        , "  -v, --verbose           show what's under the rocket." 
        , "  -h, --help              show this message." ].join("\n") );
  }
}

if (! rocket.commands.hasOwnProperty(rocket.command) ) {
  rocket.error("Unknown command: " + rocket.command);
  return
}
rocket.commands[rocket.command](rocket.argv)
})()

