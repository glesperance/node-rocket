/******************************************************************************
 * Module dependencies.
 */
 
//external dependencies
var rocket            = require('rocket')
  , Schema            = rocket.Schema
  
  , bcrypt            = require('bcrypt')
  , async             = require('async')
  ;

/******************************************************************************
 * Schema
 */
var schema = Schema({

    _id               : { 
                          type: Email
                        , required: true 
                        , index: { unique: true }
                        }
  
  , email             : { alias: '_id' }
  
  , username          : {
                          type: AlphaNumeric
                        , required: false
                        , index: { unique: true }
                        }
  
  , password_hash     : { type: String, required: true }

});

/******************************************************************************
 * Compound indexes definitions
 */
schema.indexes({ viral_link: { conversions_counter: -1, clicks_counter: -1 } });

/******************************************************************************
 * Methods
 */
schema.methods = {
    
    setPassword: function setPassword_UserInstance(password, cb) {
      
        var that = this;
        
        async.waterfall(
            [
                function(callback) { bcrypt.gen_salt(10, callback); }
                
              , function(salt, callback) {
                
                  bcrypt.encrypt(password, salt, callback);
                  
                }
              
              , function(hash, callback) {
                  
                  that.password_hash = hash;
                  callback(null);
                  
                }
            ]
          , cb
        );
        
    }

  , verifyPassword: function verifyPassword_UserInstance(password, cb) {
    
      bcrypt.compare(password, this.password_hash, cb);
      
    }
  
};
/*****************************************************************************/
module.exports = rocket.model(schema);
