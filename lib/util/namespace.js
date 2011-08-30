module.exports = {
  extractName: function extractName(filename, options) {
    var options = options || {}
      , suffix = options.suffix || ''
      , extension = options.extension || ''
      , tmp = filename.split('/')
      ;
          
    //extract *real* filename from path
    tmp = tmp[tmp.length - 1];
    
    //remove extension
    tmp = tmp.split('.');
    
    if(extension !== '') {
      if(tmp.length <= 1) {
        throw 'xxx ERROR filename has no extension [' + filename + ']';
      }             
      delete tmp[tmp.length - 1];
    }
    tmp = tmp.join('');
    
    //remove suffix
    if( tmp.slice(tmp.length - suffix.length) !== suffix){
      throw 'xxx ERROR filename hasn\'t the proper suffix { filename: "' + filename + '", suffix: "' + suffix + '"}';
    }
    tmp = tmp.slice(0, tmp.length - suffix.length);
    
    return tmp;
  },
  
  /*
   * This function implements a set of tests on controller and
   * view filenames to make sure it is not trying to set up temporary
   * editor files (i.e. .test-controller.js.swp <-- vim)
   */
  checkName: function checkName(filename) {    
    if(filename.substr(0,1) == '.') {
      return false;
    }
    
    if(filename.substr(-3) != '.js' && filename.substr(-5) != '.jade') {
      return false;
    }
    
    return true;
  }

};
