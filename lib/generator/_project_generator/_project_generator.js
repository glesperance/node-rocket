var child_process = require('child_process')
  , fs = require('fs')
  , path = require('path')
  , colors = require('colors')
  , async = require('async')
  ;

var DEFAULT = 'default';

function printExec(err, stdout, stderr) {
  if(err) {
    
    throw err;
  }
  
  if(stderr) {
    throw stderr;
  }
  
  console.log(stdout.green);
}

function projectGenerator(projectName) {

  var exists = true
    , projectPath = path.join(process.cwd(), projectName)
    
    , package_json = ['{'
        , '  "name"          : "' + projectName + '"'
        , ', "description"   : "A Rocket.js Application."'
        , ', "version"       : "0.0.1"'
        , ', "main"          : "launcher.js"'
        , ', "engines"       : { "node"   : ">=0.4.10" }'
        , ', "dependencies"  : { "rocket" : ">= 0.1.18" }'
        , '}'
        ].join('\n')
    ;
 
  if(typeof projectName !== 'string') {
    console.log('xxx ERROR: please provide a non-null project name'.red);
    process.exit(1);
  }
  
  try{
    dirStat = fs.readdirSync(projectPath);
  }catch(err){
    if(err.code === 'ENOENT') {
      exists = false;
    }
  }
  
  if(exists){
    console.log(('xxx WARNING: directory exists [' + projectPath + '] please provide another project name or remove the offending directory before proceeding').yellow);
    process.exit(1);
  }
  
  async.waterfall([
      function a(callback){ child_process.exec('mkdir -v ' + projectName, function(err) { printExec.apply(this, arguments); callback(err) ;}); }
    , function b(callback){ child_process.exec(['cd', __dirname, ';', 'cp -v -R', path.join('templates', DEFAULT) + '/*', projectPath].join(' '), function(err) { printExec.apply(this, arguments); callback(err) ;}); }
    , function c(callback){ fs.writeFile(path.join(projectPath,'package.json'), package_json, 'utf8', function(err) { if (err) { throw err; }}); }
  ], function() {});
  
}

module.exports = projectGenerator;