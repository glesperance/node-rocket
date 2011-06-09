var helpers = require('./helpers');

module.exports = {
    form_tag : function form_tag_filter() { 
      var route = arguments[1].route
        , attributes = arguments.attributes
        , form_content = arguments[0]
        ;
      
      return helpers.form_tag(route, attributes, form_content);
            
    }
};