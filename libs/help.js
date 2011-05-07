module.exports = help

help.completion = function (opts, cb) {
  if (opts.conf.argv.remain.length > 2) return cb(null, [])
  getSections(cb)
}

var fs = require("./utils/graceful-fs")
  , path = require("path")
  , exec = require("./utils/exec")
  , rocket = require("../rocket")
  , output = require("./utils/output")

function help (args, cb) {
  var section = args.shift()
  if (section === "help") {
    section = !rocket.config.get("usage") && "rocket"
  }
  if (section) {
    if ( rocket.config.get("usage")
      && rocket.commands[section]
      && rocket.commands[section].usage
    ) {
      rocket.config.set("loglevel", "silent")
      return output.write(rocket.commands[section].usage, cb)
    }
    var section_path = path.join(__dirname, "../man1/"+section+".1")
    return fs.stat
      ( section_path
      , function (e, o) {
          if (e) return cb(new Error("Help section not found: "+section))
          // function exec (cmd, args, env, takeOver, cb) {
          var manpath = path.join(__dirname, "..")
            , env = {}
          Object.keys(process.env).forEach(function (i) { env[i] = process.env[i] })
          env.MANPATH = manpath
          var viewer = rocket.config.get("viewer")
          switch (viewer) {
            case "woman":
              var args = ["-e", "(woman-find-file \"" + section_path + "\")"]
              exec("emacsclient", args, env, true, cb)
              break
            default:
              exec("man", [section], env, true, cb)
          }
        }
      )
  } else getSections(function (er, sections) {
    if (er) return cb(er)
    rocket.config.set("loglevel", "silent")
    output.write
      ( ["\nUsage: rocket <command>"
        , ""
        , "where <command> is one of:"
        , " "+wrap(Object.keys(rocket.commands))
        , ""
        , "Add -h to any command for quick help."
        , ""
        , "Specify configs in the ini-formatted file at "
          + rocket.config.get("userconfig")
        , "or on the command line via: rocket <command> --key value"
        , "Config info can be viewed via: rocket help config"
        , ""
        , "Help usage: rocket help <section>"
        , ""
        , "where <section> is one of:"
        , " " + wrap(sections)
        , ""
        , "Even more help at: rocket help help"
        ].join("\n"), function () { cb(er) })
  })
}

function wrap (arr) {
  var out = ['']
    , l = 0
  arr.sort(function (a,b) { return a<b?-1:1 })
    .forEach(function (c) {
      if (out[l].length + c.length + 2 < 60) {
        out[l] += ', '+c
      } else {
        out[l++] += ','
        out[l] = c
      }
    })
  return out.join("\n ").substr(2)
}

function getSections(cb) {
  fs.readdir(path.join(__dirname, "../man1/"), function (er, files) {
    if (er) return cb(er)
    var sectionList = files.concat("help.1")
      .filter(function (s) { return s.match(/\.1$/) })
      .map(function (s) { return s.replace(/\.1$/, '')})
    cb(null, sectionList)
  })
}
