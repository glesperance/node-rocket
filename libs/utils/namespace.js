module.exports = {
    extractName: function extractName(filename, options) {
        var options = options || {}
          , suffix = options.suffix || ''
          , extension = options.extension || ''
          , tmp = filename.split('/');
              
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
          throw 'xxx ERROR filename hasn\'t the proper suffix { filename: "' + filename + '", suffix: "' + suffix + '"Ê}';
        }
        tmp = tmp.slice(0, tmp.length - suffix.length);
        
        return tmp;
      }
  };
