process.title = "rocket"

if (require.main === module) {
  console.error(["It looks like you're doing 'node rocket.js'."
                ,"Don't do that.  Instead, run 'make install'"
                ,"and then use the 'rocket' command line utility."
                ].join("\n"))
  process.exit(1)
}

var EventEmitter = require("events").EventEmitter
  , rocket = module.exports = new EventEmitter
  , path = require("path")
  , abbrev = require("abbrev")
  , which = require("./libs/utils/which")
  , semver = require("semver")
  fs = require("./libs/utils/graceful-fs")

rocket.commands = {}
rocket.ELIFECYCLE = {}
rocket.E404 = {}
rocket.EPUBLISHCONFLICT = {}
rocket.EJSONPARSE = {}
rocket.EISGIT = {}
rocket.ECYCLE = {}
rocket.EENGINE = {}

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

var commandCache = {}
  // short names for common things
  , aliases = { "c" : "create"
              , "s" : "sample"
              , "h" : "help"
              }

  , aliasNames = Object.keys(aliases)
  // these are filenames in ./lib
  , cmdList = [ "create"
              , "sample"
              , "help"
              ]
  , fullList = rocket.fullList = cmdList.concat(aliasNames)
  , abbrevs = abbrev(fullList)

Object.keys(abbrevs).forEach(function (c) {
  Object.defineProperty(rocket.commands, c, { get : function () {
    if (!loaded) throw new Error(
      "Call rocket.load(conf, cb) before using this command.\n"+
      "See the README.md or cli.js for example usage.")
    var a = rocket.deref(c)
    if (c === "la" || c === "ll") {
      rocket.config.set("long", true)
    }
    if (commandCache[a]) return commandCache[a]
    return commandCache[a] = require(__dirname+"/lib/"+a)
  }, enumerable: fullList.indexOf(c) !== -1 })
})

rocket.deref = function (c) {
  if (plumbing.indexOf(c) !== -1) return c
  var a = abbrevs[c]
  if (aliases[a]) a = aliases[a]
  return a
}

rocket.log = function (msg) {
  if (rocket.verbose) {
    console.log(msg);
  }
}

var loaded = false
  , loading = false
  , loadListeners = []

rocket.load = function (conf, cb_) {
  if (!cb_ && typeof conf === "function") cb_ = conf , conf = {}
  if (!cb_) cb_ = function () {}
  if (!conf) conf = {}
  loadListeners.push(cb_)
  if (loaded) return cb()
  if (loading) return
  loading = true
  var onload = true

  function handleError (er) {
    loadListeners.forEach(function (cb) {
      process.nextTick(function () { cb(er, rocket) })
    })
  }

  function cb (er) {
    if (er) return handleError(er)
    loaded = true
    loadListeners.forEach(function (cb) {
      process.nextTick(function () { cb(er, rocket) })
    })
    loadListeners.length = 0
    if (onload = onload && rocket.config.get("onload-script")) {
      require(onload)
      onload = false
    }
  }
}

