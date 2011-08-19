var express           = require('express')
  , path              = require('path')
  , http              = require('http')
  , fs                = require('fs')
  ;

var client            = require('../lib/client')
  , config            = require('../lib/config')
  , FileEventEmitter  = require('../lib/util/file_event_emitter')
  ;


var testConfig        = require('./lib/test_config')
  ;

var app               = express.createServer()
  , app2              = express.createServer()
  , client_file       = new FileEventEmitter(
                                              path.join(
                                                  testConfig.TEST_PROJECT_PATH
                                                , config.CLIENT_DIR_NAME
                                              )
                                            )
  ;

describe('Client Module Loader', function() {
  
  it('should load all client `js` libs and compile them without errors', function() {
    
    var done
      , ret_err
    ;
    
    
    client.setup(
      
        app
        
      , client_file
      
      , function(err) {
          
          ret_err = err;
          done = true;
        
        }
    
    );
    
    waitsFor(function(){
      return done;
    }, 'normal setup callback to be called', 10000);
    
    runs(function() {
      
      done = false;
      
      process.env['NODE_ENV'] = 'production';
      
      client.setup(
          
          app2
          
        , client_file
        
        , function(err) {
            
            ret_err = err;
            done = true;
          
          }
      
      );
      
    });
    
    waitsFor(function(){
      return done;
    }, 'setup callback to be called', 10000);
    
    runs(function(){
      
      app.listen(3000);
      app2.listen(3001);
      
      expect(ret_err).toBeFalsy();
                
    });
    
  });
  
  it('should properly set up a middleware to statically serve the app\'s `client/static` directory ', function () {
    
    var options = {
                      host: 'localhost'
                    , port: 3000
                    , path: '/static/favicon.ico'
                  }
    
      , done    = false
      ;
    
    waitsFor(function() { return done; });
    
    http.get(options, function(res) {
      
      expect(res.statusCode).toEqual(200);
      
      done = true;
    
    }).on('error', function(err) { throw err; });
    
  });
  
  it('should properly set up a middleware to serve the `client/js` folder while **not** in production', function() {
    
    var options = {
                    host: 'localhost'
                  , port: 3000
                  , path: '/js/root_client.js'
                }
            
      , done    = false
      ;
      
      waitsFor(function() { return done; });
      
      http.get(options, function(res) {
      
      expect(res.statusCode).toEqual(200);
      
      done = true;
      
      }).on('error', function(err) { throw err; });
    
  });
  
  it('should properly set up a middleware to serve the `client/css` folder while **not** in production', function() {
    
    var options = {
                      host: 'localhost'
                    , port: 3000
                    , path: '/css/style.css'
                  }

      , done    = false
      ;
      
      waitsFor(function() { return done; });
      
      http.get(options, function(res) {
      
      expect(res.statusCode).toEqual(200);
      
      done = true;
      
      }).on('error', function(err) { throw err; });
    
  });
  
  it('should properly set up a middleware to serve the optimized JS modules while in production', function() {
    
    var options = {
                      host: 'localhost'
                    , port: 3001
                    , path: '/js/root_client.js'
                  }
  
      , done    = false
      ;
    
    waitsFor(function() { return done; });
    
    http.get(options, function(res) {
    
      expect(res.statusCode).toEqual(200);
      
      done = true;
    
    }).on('error', function(err) { throw err; });
    
    
  });
    
  it('should properly set up a middleware to serve the optimized CSS files while in production', function() {
    
    var options = {
                      host: 'localhost'
                    , port: 3001
                    , path: '/css/style.css'
                  }
    
      , done    = false
      ;
      
      waitsFor(function() { return done; });
      
      http.get(options, function(res) {
      
        expect(res.statusCode).toEqual(200);
        
        done = true;
      
      }).on('error', function(err) { throw err; });
    
  });
  
  it('should properly update the optimized JS files when changed at the file level', function() {
    
    var options = {
                    host: 'localhost'
                  , port: 3001
                  , path: '/js/other_client.js'
                }

      , done  = false
      ;
    
    this.after(function() {
      fs.rename(
          path.join(client_file.path, config.CLIENT_JS_DIR_NAME, 'other_client.js')
        , path.join(client_file.path, config.CLIENT_JS_DIR_NAME, 'root_client.js')
        , function(err) {
            
            if (err) { throw err; }
            
            done = true;
            
          }
      );
      
    });
    
    fs.rename(
        path.join(client_file.path, config.CLIENT_JS_DIR_NAME, 'root_client.js')
      , path.join(client_file.path, config.CLIENT_JS_DIR_NAME, 'other_client.js')
      , function(err) {
          
          if (err) { throw err; }
          
          done = true;
          
        }
    );
    
    waitsFor(function() { return done; });
    
    waits(5000);
    
    runs(function() {
      
      done = false;
      
      http.get(options, function(res) {
        
        expect(res.statusCode).toEqual(200);
        
        done = true;
      
      }).on('error', function(err) { throw err; });
      
    });
    
    waitsFor(function() { return done; })
    
  });
  
  it('should properly update the optimized CSS files when changed at the file level', function() {
    
    var options = {
                    host: 'localhost'
                  , port: 3001
                  , path: '/css/other_style.css'
                }

      , done  = false
      ;
    
    this.after(function() {
      fs.rename(
          path.join(client_file.path, config.CLIENT_CSS_DIR_NAME, 'other_style.css')
        , path.join(client_file.path, config.CLIENT_CSS_DIR_NAME, 'style.css')
        , function(err) {
            
            if (err) { throw err; }
            
            done = true;
            
          }
      );
      
    });
    
    fs.rename(
        path.join(client_file.path, config.CLIENT_CSS_DIR_NAME, 'style.css')
      , path.join(client_file.path, config.CLIENT_CSS_DIR_NAME, 'other_style.css')
      , function(err) {
          
          if (err) { throw err; }
          
          done = true;
          
        }
    );
    
    waitsFor(function() { return done; });
    
    waits(5000);
    
    runs(function() {
      
      done = false;
      
      http.get(options, function(res) {
        
        expect(res.statusCode).toEqual(200);
        
        done = true;
      
      }).on('error', function(err) { throw err; });
      
    });
    
    waitsFor(function() { return done; })
    
  });
  
});