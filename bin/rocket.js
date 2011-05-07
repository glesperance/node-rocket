#!/usr/bin/env node

// Big thanks to NPM for its nice script.
/*
          /\
         /  \
        /    \
       /______\
      |        |
      |        |
      |        |
      |        |
      |        |
      |        |
     /|   ||   |\
    / |   ||   | \
   /  |   ||   |  \
  /___|   ||   |___\
      |        |
       \      /
        ||  ||
*/
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
    console.error("Houston.. we have a problem. >>> " + msg);
    rocket.commands.help();
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
  , add: function () {
    try {
      if (rocket.argv.length < 1) {
        rocket.error("A page name is expected.");
        process.exit(1);
      }

      if (!path.existsSync(path.join(process.cwd(), "client"))
          || !path.existsSync(path.join(process.cwd(), "controllers"))
          || !path.existsSync(path.join(process.cwd(), "views"))
          || !path.existsSync(path.join(process.cwd(), "exports"))
          || !path.existsSync(path.join(process.cwd(), "models"))) {
        rocket.error("You must be in the project root directory.");
        process.exit(1);
      }
      
      if (path.existsSync(path.join(process.cwd(), "client", "libs", rocket.argv[0] + ".bootstrap.js"))
         || path.existsSync(path.join(process.cwd(), "controllers", rocket.argv[0] + ".controller.js"))
         || path.existsSync(path.join(process.cwd(), "views", rocket.argv[0]))
         || path.existsSync(path.join(process.cwd(), "views", rocket.argv[0], rocket.argv[0] + ".index.view.jade"))) {
        rocket.error("Looks like you already have that page!");
        process.exit(1);
      }

      fs.writeFileSync(path.join(process.cwd(), "client", "libs", rocket.argv[0] + ".bootstrap.js"), "Put content here.");
      fs.writeFileSync(path.join(process.cwd(), "controllers", rocket.argv[0] + ".controller.js"), "Put content here.");
      fs.mkdirSync(path.join(process.cwd(), "views", rocket.argv[0]), 0777);
      fs.writeFileSync(path.join(process.cwd(), "views", rocket.argv[0], rocket.argv[0] + ".index.view.jade"), "Put content here.");
      console.log("The rocket landed the page.");
    }
    catch (err) {
      rocket.error(err);
      process.exit(1);
    }
  }
  , help: function () {
    console.log([
        "Usage: rocket [OPTIONS] ARGUMENTS\n" 
        , "Arguments:" 
        , "  create NAME_OF_YOUR_PROJECT    create a rocket project ()"
        , "  add PAGE_NAME                  add a new page to the project"
        , "Options:" 
        , "  -v, --verbose                  show what's under the rocket." 
        , "  -h, --help                     show this message." ].join("\n") );
  }
}

if (! rocket.commands.hasOwnProperty(rocket.command) ) {
  rocket.error("Unknown command: " + rocket.command);
  return
}
rocket.commands[rocket.command](rocket.argv)
})()

