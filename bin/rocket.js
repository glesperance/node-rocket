#!/usr/bin/env node

// Big thanks to NPM for its nice script.
;(function () { // wrapper in case we're in module_context mode
var path = require("path")
  , rocket = require("../rocket")
  , nopt = require("nopt")
  , knownOpts = { "help" : Boolean
                , "verbose" : Boolean
                , "version" : Boolean
                }
  , shortHands = { "h" : ["--help"]
                 , "v" : ["--verbose"]
                 }
  , parsed = nopt(knownOpts, shortHands, process.argv, 2)
rocket.verbose=parsed.verbose 
rocket.argv= parsed.argv.remain;
rocket.command = rocket.argv.shift();

rocket.log("Running command: " + rocket.command);

if (parsed.version) {
  rocket.log(rocket.version)
  return
} else rocket.log("rocket@"+rocket.version, "using")
rocket.log("node@"+process.version, "using");

// make sure that this version of node works with this version of rocket.
var semver = require("semver")
  , nodeVer = process.version
  , reqVer = rocket.nodeVersionRequired
if (reqVer && !semver.satisfies(nodeVer, reqVer)) {
  console.error("rocket doesn't work with node " + nodeVer + "\nRequired: node@" + reqVer)
  return
}

process.on("uncaughtException", function(er) {
    console.error(er);
});

if (parsed.help && rocket.command !== "help") {
  rocket.argv.unshift(rocket.command)
  rocket.command = "help"
}

// now actually fire up rocket and run the command.
// this is how to use rocket programmatically:
conf._exit = true
rocket.load(conf, function (er) {
  if (er) return console.error("Error while running command" + rocket.command + ": " + er);
  rocket.commands[rocket.command](rocket.argv)
})
})()

