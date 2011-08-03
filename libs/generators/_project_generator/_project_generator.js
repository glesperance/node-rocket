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
  
  async.series
    (
      function a(){ child_process.exec('mkdir -v ' + projectName, printExec); }
    , function b(){ child_process.exec(['cd', __dirname, ';', 'cp -v -R', path.join('templates', DEFAULT), projectPath].join(' '), printExec); }
    );
  
}

module.exports = projectGenerator;