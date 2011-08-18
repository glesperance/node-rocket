

(function () {
var jq = typeof jQuery !== "undefined" && jQuery;
define("jquery", [], function () { return jq; });
}());



(function () {
var jq = typeof jQuery !== "undefined" && jQuery;
define("jquery", [], function () { return jq; });
}());



(function () {
var jq = typeof jQuery !== "undefined" && jQuery;
define("jquery", [], function () { return jq; });
}());

$.fn.alpha = function() {
    return this.append('<p>Alpha is Go!</p>');
};
define("lib/jquery.alpha", function(){});

$.fn.beta = function() {
    return this.append('<p>Beta is Go!</p>');
};

define("lib/jquery.beta", function(){});

require(["jquery", "lib/jquery.alpha", "lib/jquery.beta"], function($) {
    //the jquery.alpha.js and jquery.beta.js plugins have been loaded.
    $(function() {
        $('body').alpha().beta();
    });
});

define("root_client", function(){});
