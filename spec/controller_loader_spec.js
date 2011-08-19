var express           = require('express')
  , path              = require('path')
  , fs                = require('fs')
  ;

var controller        = require('../lib/controller')
  , dadt              = require('../lib/util/dadt')
  , FileEventEmitter  = require('../lib/util/file_event_emitter')
  , config            = require('../lib/config')
  ;


var testConfig        = require('./lib/test_config')
  ;

var app         = express.createServer()
  , routes_dadt = dadt.createNode()
  , controllers = new FileEventEmitter(
                                        path.join(
                                            testConfig.TEST_PROJECT_PATH
                                          , config.CONTROLLERS_DIR_NAME
                                        )
                                      )
  ;

describe('Controller Modules Loader', function() {  
  
  it('should scan the controllers directory without errors', function(){
    
    var done
      , ret_err
      ;
    
    waitsFor(function(){
      return done;
    }, 'setup callback to be called', 10000);
    
    controller.setup(
      
        app
      
      , routes_dadt
      
      , controllers
      
      , function(err) {
          
          ret_err = err;
          done = true;
        
        }
    
    );
    
    runs(function(){
      
      expect(ret_err).toBeFalsy();
                
    });
    
  });
      
  it('should map all the controllers, to their respective routes', function(){
  
    var dummies_routes = new Object(app.resources.dummies.routes)
      , allCustom      = app.match('/dummies/allCustom') 
      ;
    
    expect(allCustom.length).toEqual(33);
    
    expect(dummies_routes.get).toBeDefined()
    expect(dummies_routes.get['/dummies.:format?']).toBeDefined()
    expect(dummies_routes.get['/dummies/:dummie.:format?']).toBeDefined()
    expect(dummies_routes.get['/dummies/new.:format?']).toBeDefined()
    
    expect(dummies_routes.put).toBeDefined()
    expect(dummies_routes.put['/dummies/:dummie.:format?']).toBeDefined()

    
    expect(dummies_routes.post).toBeDefined()
    expect(dummies_routes.post['/dummies.:format?']).toBeDefined()
    
    expect(dummies_routes.del).toBeDefined()
    expect(dummies_routes.del['/dummies/:dummie.:format?']).toBeDefined()
    
    expect(app.lookup('/dummies/custom').length).toEqual(4);
    expect(app.lookup('/dummies/custom/:dummie').length).toEqual(4);
 
  });
  
  it('should properly populate the dadt datastore', function() {
    expect(routes_dadt.get('dummies')).toBeDefined();
    expect(routes_dadt.get('dummies').get('name')).toBeDefined();
    expect(routes_dadt.get('dummies').get('index')).toBeDefined();
    expect(routes_dadt.get('dummies').get('show')).toBeDefined();
    expect(routes_dadt.get('dummies').get('update')).toBeDefined();
    expect(routes_dadt.get('dummies').get('create')).toBeDefined();
    expect(routes_dadt.get('dummies').get('new')).toBeDefined();
    expect(routes_dadt.get('dummies').get('destroy')).toBeDefined();
    expect(routes_dadt.get('dummies').get('custom')).toBeDefined();
    expect(routes_dadt.get('dummies').get('allCustom')).toBeDefined();
  });
  
  it('should properly handle deletions/additions of controllers', function() {
    
    var done
      ;
    
    this.after(function() {
      fs.rename(
          path.join(controllers.path, 'stupids_controller.js')
        , path.join(controllers.path, 'dummies_controller.js')
        , function(err) {
            if (err) { throw err; }
          }
      );
    });
    
    waitsFor(function() { return done; }, 'renaming dummies controller', 5000);
    
    fs.rename(
        path.join(controllers.path, 'dummies_controller.js')
      , path.join(controllers.path, 'stupids_controller.js')
      , function(err) {
          if (err) { throw err; } else { done = true; }
        }
    );
    
    waits(5000);
    
    runs(function() {
      
      var stupids_routes = new Object(app.resources.stupids.routes)
        , allCustom      = app.match('/stupids/allCustom') 
        ;
      
      expect(allCustom.length).toEqual(33);
      
      expect(stupids_routes.get).toBeDefined()
      expect(stupids_routes.get['/stupids.:format?']).toBeDefined()
      expect(stupids_routes.get['/stupids/:stupid.:format?']).toBeDefined()
      expect(stupids_routes.get['/stupids/new.:format?']).toBeDefined()
      
      expect(stupids_routes.put).toBeDefined()
      expect(stupids_routes.put['/stupids/:stupid.:format?']).toBeDefined()

      
      expect(stupids_routes.post).toBeDefined()
      expect(stupids_routes.post['/stupids.:format?']).toBeDefined()
      
      expect(stupids_routes.del).toBeDefined()
      expect(stupids_routes.del['/stupids/:stupid.:format?']).toBeDefined()
      
      expect(app.lookup('/stupids/custom').length).toEqual(4);
      expect(app.lookup('/stupids/custom/:stupid').length).toEqual(4);
      
    });
    
  });
  
  it('should be able to react on file changes', function() {
    
    var changing_controller_path =  path.join(controllers.path, 'shapeshifters_controller.js')
      ;
    
    this.after(function() {
      
      fs.writeFileSync(
          
          changing_controller_path
        
        , [
           'exports.index = function(req, res) {}'
          ].join('\n') 
        
        , encoding='utf8');
      
    });
    
    fs.writeFileSync(
      
        changing_controller_path
      
      , [
         'exports.index = function(req, res) {}'
        , ''
        , 'exports.destroy = function(req, res) {}'
        ].join('\n') 
      
      , encoding='utf8');
    
    waits(5000);
    
    runs(function() {
      
      expect(app.lookup('/shapeshifters/:shapeshifter.:format?', 'delete').length).toEqual(1);
      
    });
    
    
  });
  
});