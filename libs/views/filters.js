var helpers = require('./helpers');

module.exports = {
    form_tag : function form_tag_filter() { 
      var route = arguments[1].route
        , attributes = arguments.attributes
        , content_fun_str = arguments[0]
        , content_fun = undefined
        ;
      
      content_fun_str = content_fun_str.replace(/\\([^n])/g, '$1');
      content_fun_str = content_fun_str.replace(/\\n/g, '\n');
      
      content_fun = new Function(content_fun_str);
      
      return helpers.form_tag(route, attributes, content_fun);
            
    }
};