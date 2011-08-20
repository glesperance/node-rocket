var net               = require('net')
  , path              = require('path')
  , fs                = require('fs')
  , dnode             = require('dnode')
  ;

var export            = require('../lib/export')
  , FileEventEmitter  = require('../lib/util/file_event_emitter')
  , config            = require('../lib/config')
  ;


var testConfig        = require('./lib/test_config')
  ;

var app           = net.createServer()
  , exports_file  = new FileEventEmitter(
                                          path.join(
                                              testConfig.TEST_PROJECT_PATH
                                            , config.EXPORTS_DIR_NAME
                                          )
                                        )
  ;

describe('Dnode Exports Loader', function() {
  
  it('should properly load all dnode exports without error', function() {
    
    var done
      , ret_err
      ;
    
    export.setup(
        
        app
      
      , exports_file
      
      , function(err) {
                    
          ret_err = app.listen(3000);
          done = true;

        }
    );
    
    waitsFor(function() { 
      
      return done; 
    
    }, 'Dnode export loading', 5000);
    
    runs(function() {
      
      expect(ret_err).toBeFalsy();
      
    });
    
  });
  
  
  it('should properly export functions', function() {
    
    var done
      ;
    
    dnode.connect(3000, function(remote, conn) {
      
      expect(remote).toBeDefined();
      
      expect(remote.func).toBeDefined();
      expect(remote.func.msg).toEqual('hello world');
      
      remote.obj.ping(function(ret) {
        
        expect(ret).toEqual('pong');
        done = true;
        
      });
      
    });
    
    waitsFor(function() {
      return done;
    }, 'dnode connection to be established', 5000);
        
  });
  
  it('should properly export objects', function() {
    
    var done
      ;
    
    dnode.connect(3000, function(remote, conn) {
      
      expect(remote).toBeDefined();
      
      expect(remote.obj).toBeDefined();
      expect(remote.obj.msg).toEqual('bonjour monde');
            
      remote.obj.ping(function(ret) {
        
        expect(ret).toEqual('pong');
        done = true;
        
      });
      
    });
    
    waitsFor(function() {
      return done;
    }, 'dnode connection to be established', 5000);
    
  });
  
  it('should properly handle addittion/removal of export files', function() {
    
    var done;
    
    this.after(function() {
      
      fs.rename(
          
          path.join(exports_file.path, 'shapeshifter2.js')
        , path.join(exports_file.path, 'shapeshifter.js')
        , function(err) { if (err) { throw err; } }
      );
      
      
    });
    
    runs(function(){
      
      done = false;
      
      fs.rename(
          
          path.join(exports_file.path, 'shapeshifter.js')
        , path.join(exports_file.path, 'shapeshifter2.js')
        , function(err) {
          
            expect(err).toBeFalsy();
            
            done = true;
          
          }
      );
      
    });
    
    waitsFor(function() {
      return done;
    }, 'renaming to be done', 5000);
    
    waits(5000);
    
    runs(function() {
      
      done = false;
      
      dnode.connect(3000, function(remote, conn) {
        
        expect(remote).toBeDefined();
        
        expect(remote.shapeshifter).toBeUndefined();
        expect(remote.shapeshifter2).toBeDefined();
        expect(remote.shapeshifter2.msg).toEqual('Vice');
        
        done = true;
        
      });
      
    });
    
    waitsFor(function() {
      return done;
    }, 'dnode connection to be established', 5000);
    
  });
  
  it('should properly handle modifications of export files', function() {
    
    var done
      ;
    
    this.after(function() {
      
      var done
        ;
      
      fs.writeFile(
          
          path.join(exports_file.path, 'shapeshifter.js')
          
        , 'exports.msg = \'Vice\'\n'
          
        , 'utf8'
          
        , function(err) {
            
            if (err) { throw err; }
            
            done = true;
            
          }
      );
      
      waitsFor(function() { return done; })
      
    });

    runs(function() {
          
      fs.writeFile(
          
          path.join(exports_file.path, 'shapeshifter.js')
          
        , 'exports.msg = \'Versa\'\n'
          
        , 'utf8'
          
        , function(err) {
            
            if (err) { throw err; }
            done = true;
          }
        
      );
      
    });
    
    waitsFor(function() { return done; }, 'renaming to be done', 5000);
    
    waits(5000);
    
    runs(function() {
          
      done = false;
  
      dnode.connect(3000, function(remote, conn) {
        
        expect(remote).toBeDefined();
        
        expect(remote.shapeshifter).toBeDefined();
        expect(remote.shapeshifter.msg).toEqual('Versa');
        
        done = true;
        
      });
      
    });
    
    waitsFor(function() {
      return done;
    }, 'dnode connection to be established', 5000);
    
    
  });
  
});