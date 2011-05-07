#!/usr/bin/env node

# Big thanks to NPM for its nice script.
;(function () { // wrapper in case we're in module_context mode
var log = require("../lib/utils/log")
log.waitForConfig()
log.info("ok", "it worked if it ends with"
var fs = require("../lib/utils/graceful-fs")
  , path = require("path")
  , sys = require("../lib/utils/sys")
  , rocket = require("../rocket")
  , ini = require("../lib/utils/ini")
  , rm = require("../lib/utils/rm-rf")
  , errorHandler = require("../lib/utils/error-handler")

  , configDefs = require("../lib/utils/config-defs")
  , shorthands = configDefs.shorthands
  , types = configDefs.types
  , nopt = require("nopt")

log.verbose(process.argv, "cli")

var conf = nopt(types, shorthands)
rocket.argv = conf.argv.remain
if (rocket.deref(rocket.argv[0])) rocket.command = rocket.argv.shift()
else conf.usage = true


if (conf.version) {
  console.log(rocket.version)
  return
} else log("rocket@"+rocket.version, "using")
log("node@"+process.version, "using")

// make sure that this version of node works with this version of rocket.
var semver = require("semver")
  , nodeVer = process.version
  , reqVer = rocket.nodeVersionRequired
if (reqVer && !semver.satisfies(nodeVer, reqVer)) {
  return errorHandler(new Error(
    "rocket doesn't work with node " + nodeVer
    + "\nRequired: node@" + reqVer), true)
}

process.on("uncaughtException", errorHandler)

if (conf.usage && rocket.command !== "help") {
  rocket.argv.unshift(rocket.command)
  rocket.command = "help"
}

// now actually fire up rocket and run the command.
// this is how to use rocket programmatically:
conf._exit = true
rocket.load(conf, function (er) {
  if (er) return errorHandler(er)
  rocket.commands[rocket.command](rocket.argv, errorHandler)
})
})()

