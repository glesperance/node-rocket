var lingo = require('lingo')
  , colors = require('colors')
  , path = require('path')
  , fs = require('fs')
  ;

controllerGenerator.info = function controllerGeneratorInfo() {
  console.log(
              [
                ''
              , 'Creates a new controller in ./controller'
              , ''
              , 'Usage:'
              , '  rocket --add controller [name] [verb1] [verb2] ...'
              , ''
              , '  where verbs are {index, new, create, show, edit, update, destroy}'
              , '  All if none are specified.'
              , ''
              ].join('\n'));
}

function controllerGenerator() {
  var args = Array.prototype.slice.call(arguments)
    , name = args.shift() 
    , singular_name = lingo.en.singularize(name)
    , has_view = args.pop()
    , verbs = args
    , all = ( verbs.length === 0 ? true : false)
    , buf = ''
    , filename = path.join(process.cwd(), 'controllers', name + '_controller.js')
    , controller_views_dir = path.join(process.cwd(), 'views', name )
    , exists;
    
    exists = path.existsSync(filename);
    
    if(exists){
      throw ('xxx ERROR Controller ['+ name + '] already present in [' + path.join(process.cwd(), 'controllers') + ']').red;
    }
    
    if(typeof name === 'undefined' || name === null || lingo.en.isSingular(name)) {
      throw 'xxx ERROR Controller name must be plural and non-null !'.red;
    }
    
    var VERBS = {
        'index'   : 'GET /' + name 
      , 'new'     : 'GET /' + name + '/new' 
      , 'create'  : 'POST /' + name
      , 'show'    : 'GET /' + name + '/:' + singular_name
      , 'edit'    : 'GET /' + name + '/:' + singular_name + '/edit'
      , 'update'  : 'PUT /' + name + '/:' + singular_name
      , 'destroy' : 'DELETE /' + name + '/:' + singular_name
      };
      
    if(has_view){
      if(!path.existsSync(controller_views_dir)) {
        fs.mkdirSync(controller_views_dir, 0755);
      }
    }
    
    for(var key in VERBS) {
      if(all || verbs.indexOf(key) !== -1){
        buf += 
              [
                ''
              , '/******************************************************************************'
              , ' * ' + VERBS[key]
              , ' */'
              , 'exports.' + key + ' = function(req, res) { res.send(); }'
              , ''
              ].join('\n');
        fs.closeSync(fs.openSync(path.join(controller_views_dir, [name, key, 'jade'].join('.')), 'a'));
      }
      
    }
    
    fs.writeFileSync(filename, buf);
}

module.exports = controllerGenerator;