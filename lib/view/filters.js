var helpers = require('./helpers')
  , jade    = require('jade')
  ;


function form_tag_filter() { 
  var route = arguments[1].route
    , attributes = arguments.attributes
    , content_fun_str = arguments[0]
    , content_fun = undefined
    ;
  console.log(require('util').inspect(arguments[0].nodes, 5));
  var c = new jade.Compiler(arguments[1].node);
  
  //return c.compile();
  
  //content_fun_str = content_fun_str.replace(/\\([^n])/g, '$1');
  //content_fun_str = content_fun_str.replace(/\\n/g, '\n');
  
  //content_fun = new Function(content_fun_str);
  
  //return helpers.form_tag(route, attributes, content_fun);
  
  return 'buf.push(\'<h3>yo</h3>\');';
}


exports.form_tag = form_tag_filter;