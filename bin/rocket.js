#!/usr/bin/env node

(function () {
  
  var fs = require('fs')
    , nopt = require('nopt')
    , colors = require('colors')
    , path = require('path')
    ;

/******************************************************************************
 * PRINT USAGE
 */
  function printUsage() {
    
    var generators = fs.readdirSync(path.join(__dirname, '..', 'lib', 'generator'))
      , generators_list = ''
      ;
    
    for(var i = 0, len = generators.length; i < len; i++) {
      if(generators[i].substr(0,1) !== '_') {
        generators_list += generators[i].split('_')[0] + ' ';
      }
    }
  
    console.log(
        [
          ''
        , 'Usage: rocket [command] [argument(s)]' 
        , ''
        , 'Options:'
        , '  -v, --version................................Prints RocketJS\' version'
        , '  -h, --help...................................Prints this message'
        //, '  -p, --prod, --production.....................Set the current environment to be production mode.'
        //, '                                               Default is development. Used in conjunction with --start'
        //, '  -d, --daemon.................................Set the server to be started in daemon mode.'
        , '                                                 *** Use --kill to stop the server *** Used in conjunction with --start'
        //, '  -k, --kill...................................Kill the server if it is running. Done before --start if used together.' 
        , ''
        , 'Commands:'
        //, '  -s, --start..................................Launch current RocketJS project'
        , '  -I, --init [project name]....................Initialize project app'
        , '  -a, --add  [options].........................Add a [type] object to the current project working directory'
        , '                                                 do --info [type] for more info'
        , '  -i, --info [type]............................Prints usage information about [type] object'
        , ''
        , 'Available object types: ' + generators_list
        , ''
        ].join('\n') 
    );
  };

/******************************************************************************
 * PRINT VERSION
 */ 
 function printVersion() {
    console.log(
      [
        ''
      , '====----> RocketJS ' + require('rocket').version + ' | RocketJS.net | @RocketJS'
      , '====----> The rapid development framework for node.js/couchDB web apps'
      , ''
      ].join('\n')
    );
 }
 
/******************************************************************************
 * KILL SERVER
 */
  function killServer() {

  }

/******************************************************************************
 * START SERVER
 */
 function startServer() {
 
 }
  
/******************************************************************************
 * MAIN
 */
  var knownOpts = {
          'version'     : Boolean
        , 'help'        : Boolean
        , 'init'        : String
        , 'add'         : String
        , 'info'        : String
        , 'start'       : Boolean
        , 'production'  : Boolean 
        , 'daemon'      : Boolean
        , 'kill'        : Boolean
        , 'no-view'     : Boolean
      }
    , shortHands = {
          'v' : ['--version']
        , 'h' : ['--help']
        , 'I' : ['--init']
        , 'a' : ['--add']
        , 'i' : ['--info']
        , 's' : ['--start']
        , 'p' : ['--production']
        , 'd' : ['--daemon']
        , 'k' : ['--kill']
      }
    , parsed = nopt(knownOpts, shortHands)
    ;
  
  
  if(parsed.argv.original.length === 0 || parsed.help) {
    printUsage();
    return;
  }else if(parsed.version) {
    printVersion();
    return; 
  }else{
  
    if(parsed.kill) {
      killServer();
    }
  
    if(parsed.init) {
      require('../lib/generator/_project_generator')(parsed.init);
    }else if(parsed.info) {
    
        generator = require('../lib/generator/' + parsed.info + '_generator/').info();
      
    }else if(parsed.add) {
      
      var generator
        , args
        , idx
        , i
        , cooked = parsed.argv.cooked
        ;
      
      try {
        generator = require('../lib/generator/' + parsed.add + '_generator');
      }catch(err){
          console.log(('xxx ERROR : [' + parsed.add + '] wrong element type.').red);
      }
      
      for(
          idx = i = cooked.indexOf('--add') + 1; 
          i < cooked.length && cooked[i].substr(0,2) !== '--' ; 
          i++
         );
      
      args = cooked.slice(idx + 1, i);
      args.push((typeof parsed.view === 'undefined' ? true : parsed.view));
      
      generator.apply(generator, args);
    }else if(parsed.start) {
      startServer({daemon: parsed.daemon, production: parsed.production});
    }
    
  }

})();