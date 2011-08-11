var express = require('express')
  , express = require('express')
  ;

var view = require('../lib/view')
  , dadt              = require('../lib/util/dadt')
  , FileEventEmitter  = require('../lib/util/file_event_emitter')
  , config            = require('../lib/config')
  ;

var app               = express.createServer()
  , routes_dadt       = dadt.createNode()
  , views             = new FileEventEmitter(
                                              path.join(
                                                  testConfig.TEST_PROJECT_PATH
                                                , config.VIEWS_DIR_NAME
                                              )
                                            )
  ;

var testConfig        = require('./lib/test_config')
  ;


describe('View Module Loader', function() {
  
  var app = express.createServer()
    ;
  
  it('should scan the views directory without errors', function(){
    
    var done
      , ret_err
      ;
    
    waitFor(function() { return done; }, 'views to be fully loaded', 5000)
    
    view.setup(app, routes_dadt, views, function(err) {
      
      ret_err = err;
      done = true;
      
    });
    
    runs(function() { 
    
      expect(err).toBeFalsy();
    
    });
    
  });
  
  it('should properly populate the dadt datastore', function() {
    
    var dummies_node        = dadt.get('dummies')
      , dummies_index_node  = dummies_node.get('index')
      , dummies_show_node = dummies_node.get('show')
      ; 
    
    expect(dummies_node).toBeDefined();
    expect(dummies_index_node).toBeDefined();
    expect(dummies_show_node).toBeDefined();
    
    expect(dummies_index_node.get('view')).toEqual(
        path.join(
            views.path
          , 'dummies.index.jade'
        )
    );
    
    expect(dummies_show_node.get('view')).toEqual(
        path.join(
            views.path
          , 'dummies.show.jade'
        )
    );
    
  });
  
  it('should properly handle deletions/additions of views at the file level', function() {
  
  });
  
  it('should properly handle deletions/additions of views at the directory level', function() {
  
  });
  

});