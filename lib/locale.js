var async               = require('async')
  , i18n                = require('jade-i18n')
  ;

var asyncFs             = require('./util/async_fs')
  
  , config              = require('./config')
  , LOCALES_NAME_REGEXP = config.LOCALES_NAME_REGEXP
  ;

exports.i18n  = i18n;

exports._     = i18n.helpers._;

/******************************************************************************
 * Setup phrases as defined by `locale_file`, watches `locale_file` for
 * changes and makes changes accordingly. Also removes all the phrases on file
 * deletion.
 * 
 * @param locale_file {Object} The FileEventEmitter object of the current locale
 * file.
 * 
 * @param matches {Array} Array of the matched patterns of the RegExp selecting
 * this locale file. 
 * 
 * @param callback {Function} A callback of the form `function(err)`
 */
function setupLocale(locale_file, matches, callback) {
  
  var locale  = require(locale_file.path)
    , lang    = matches[1]
    , phrase
    ;
  
  function setupPhrases(locale) {
    
    var translation
      ;
    
    for (var phrase in locale) {
    
      translation = locale[phrase];
      
      i18n.phrase(lang, phrase, translation);
    
    }
    
  }
  
  function removePhrases(locale) {
    
    for (var phrase in locale) {
      
      i18n.phrase(lang, phrase, undefined);
    
    }
    
  }
  
  locale_file.on('change', function(curr, prev) {
    
    delete require.cache[locale_file.path];
    
    removePhrases(locale);
    
    locale = require(locale_file.path);
    
    setupPhrases(locale);
    
  });
  
  locale_file.on('destroy', function(curr, prev) {
    
    delete require.cache[locale_file.path];
    
    removePhrases(locale);
    
  });
  
  setupPhrases(locale);
  
  if (callback) { callback(null) };
  
}

/******************************************************************************
 * Setups the localized strings, also watches the `locales` directory for new
 * files or changes and calls `setupLocale` accordingly.
 * 
 * @param locales_folder_file {Object} The FileEventEmitter object of the 
 * `locales` folder.
 *                        
 * @param callback {Function} A callback of the form `function(err)`
 */
exports.setup = function() {
  
  var args                = Array.prototype.slice.call(arguments)
    
    , locales_folder_file = args.shift()
    
    , callback            = args.pop()
    ;
  
  asyncFs.mapDir(
      
      locales_folder_file.path
    
    , [ LOCALES_NAME_REGEXP, setupLocale ]
      
    , callback
  
  );
  
}