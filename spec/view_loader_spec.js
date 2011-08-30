var express           = require('express')
  , fs                = require('fs')
  , path              = require('path')
  ;

var view              = require('../lib/view')
  , dadt              = require('../lib/util/dadt')
  , FileEventEmitter  = require('../lib/util/file_event_emitter')
  , config            = require('../lib/config')
  ;

var app               = express.createServer()
  , routes_dadt       = dadt.createNode()
  , testConfig        = require('./lib/test_config')
  , views             = new FileEventEmitter(
                                              path.join(
                                                  testConfig.TEST_PROJECT_PATH
                                                , config.VIEWS_DIR_NAME
                                              )
                                            )
  ;

describe('View Module Loader', function() {
  
  var app = express.createServer()
    ;
  
  it('should scan the views directory without errors', function(){
    
    var done
      , ret_err
      ;
    
    waitsFor(function() { return done; }, 'views to be fully loaded', 5000)
    
    view.setup(app, routes_dadt, views, function(err) {
      
      ret_err = err;
      done = true;
      
    });
    
    runs(function(err) { 
    
      expect(err).toBeFalsy();
    
    });
    
  });
  
  it('should properly populate the dadt datastore', function() {
    
    var dummies_node        = routes_dadt.get('dummies')
      , dummies_index_node  = dummies_node.get('index')
      , dummies_show_node   = dummies_node.get('show')
      ; 
    
    expect(dummies_node).toBeDefined();
    expect(dummies_index_node).toBeDefined();
    expect(dummies_show_node).toBeDefined();
    
    expect(dummies_index_node.get('view')).toBe(
        path.join(
            views.path
          , 'dummies'
          , 'dummies.index.jade'
        )
    );
    
    expect(dummies_show_node.get('view')).toBe
    (
        path.join(
            views.path
          , 'dummies'
          , 'dummies.show.jade'
        )
    );
    
  });
  
  it('should properly handle deletions/additions of views at the file level', function() {
    
    var done
      ;
    
    waitsFor(function() { return done; }, 'renaming single view file', 5000)
    
    fs.rename(
        path.join(views.path, 'dummies', 'dummies.index.jade')
      , path.join(views.path, 'dummies', 'dummies.create.jade')
      , function(err) { if (err) { throw err; } else { done = true; } }
    );
    
    waits(5000);
    
    runs(function() {
      
      var dummies_node        = routes_dadt.get('dummies')
        , dummies_index_node  = dummies_node.get('index')
        , dummies_create_node = dummies_node.get('create')
        ; 
      
      expect(dummies_index_node.get('view')).toBeUndefined();
      expect(dummies_create_node.get('view')).toBeDefined();
    
    });
    
    this.after(function() {
      
      fs.rename(
          path.join(views.path, 'dummies', 'dummies.create.jade')
        , path.join(views.path, 'dummies', 'dummies.index.jade')
        , function(err) { if (err) { throw err; } }
      );
      
    });
    
  });
  
  it('should properly handle deletions/additions of views at the directory level', function() {
  
    var done
    ;
  
    waitsFor(function() { return done; }, 'renaming view folder file', 5000)
    
    fs.rename(
        path.join(views.path, 'dummies')
      , path.join(views.path, 'stupids')
      , function(err) { if (err) { throw err; } else { done = true; } }
    );
    
    waits(5000);
    
    runs(function() {
      
      var stupids_node        = routes_dadt.get('stupids')
        , stupids_index_node  = stupids_node.get('index')
        , stupids_show_node   = stupids_node.get('show')
        
        , dummies_node        = routes_dadt.get('dummies')
        , dummies_index_node  = dummies_node.get('index')
        , dummies_show_node   = dummies_node.get('show')
        ;
        ; 
    
      expect(stupids_index_node.get('view')).toBeDefined();
      expect(stupids_show_node.get('view')).toBeDefined();
    
      expect(dummies_index_node.get('view')).toBeUndefined();
      expect(dummies_show_node.get('view')).toBeUndefined();
      
    });
    
    this.after(function() {
      
      fs.rename(
          path.join(views.path, 'stupids')
        , path.join(views.path, 'dummies')
        , function(err) { if (err) { throw err; } }
      );
      
    });
    
  });
  

});