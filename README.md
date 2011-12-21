# Rocket (node-rocket)
##The rapid development framework for node.js web applications

<img src="https://github.com/glesperance/node-rocket/raw/master/lib/logo.png" width="200" alt="Node Rocket Rocks!" />

RocketJS.net a.k.a. node-Rocket is a project created by Gabriel Lespérance during the “Startupfier Summer Kick-off: Hackathon” in order to allow rapid development of real-time web applications using node.js.

Highly inspired by Ruby on Rails and cakePHP, Rocket puts forward the convention over configuration principle in order to simplify and speedup the software development process and allow easier scalability by leveraging node.js asynchronous behavior as well as its javascript nature. 

Central to RocketJS is the principle of having a single point of contact between the programmer and the underlying application and resources. Hence, RocketJS aims to blur and reduce as much as possible the separation between the client (browser) and the server (node.js) while maximizing the scaling potential (for instance by allowing code sharing between the server and the client) and improving the performance of the resulting web application.  

Built on top of express -- node.js’ high performance web development framework -- RocketJS provides a robust structure on which to build your web applications without sacrificing any of your freedom.

### RocketJS Features
* Automatic routing of your controllers
* Automatic mapping of your views to their corresponding controller
* Easy web-socket / comet application support through dnode
* Easy server / client code sharing allowing the client to  use RequireJS  `require()` command to import/use server JS libraries
* High focus on RESTful controller conventions
* Client-side support for jade template
* Automagic optimization of client javascript modules and CSS files
* Easy i18n localization
* Automatic reloading of modules when a modification is detected allowing easy and fast development.  
* View rendering and partials support
* Connect middleware support
* Built on top of express

## Installation

    $ npm install rocket
    
## Usage
  
    Usage: rocket [command] [argument(s)]

    Options:
      -v, --version................................Prints RocketJS' version
      -h, --help...................................Prints this message
                                                     *** Use --kill to stop the server *** Used in conjunction with --start
    
    Commands:
      -I, --init [project name]....................Initialize project app
      -a, --add  [options].........................Add a [type] object to the current project working directory
                                                     do --info [type] for more info
      -i, --info [type]............................Prints usage information about [type] object
    
    Available object types: controller 

## Directory Structure of a Rocket Project

    ./
    |
    |-- client
    |    # Contains all the files used by the client, including CSS, Javascript libraries and 
    |    # static files.
    |
    |-- controllers
    |    # Contains your application's controllers.
    |     
    |-- exports
    |    # Contains your application's modules that will be exported to the client. 
    |
    |-- libs
    |    # Contains all your (other) application's libraries.
    |
    |-- locales
    |    # Contains all your localization files.
    |
    |-- models
    |    # Contains all your applications's models.
    |
    |-- views
    |    # Contains your applications's main layout, template files and associated
    |    # partials.
    |
    |- launcher.js

## Client
### Structure of the Client directory

    ./client/
    |
    |-- css
    |    # Contains all the CSS files that are exported to the client.
    |
    |-- js
    |    # Contains all the javascript files that are exported (through requireJS)
    |    # to the client. All these files can then be accessed via `require()`
    |    
    |-- static
         # Contains all your static files.

### Allow the browser to require() your javascript modules with ./client/js/

#### Structure of the `client/js` directory

    ./client/js/
    |
    |-- libs
    |    # Contains all your client side libraries used by your client modules. 
    |
    |-- vendors
    |    # Contains all 3rd party libraries used by your application.
    |
    |-- views
    |    # Contains all your client jade partial files
    |
    |- require.config.json
         # This file contains all your custom requireJS modules paths
         # configuration. This is extremely handy to make sure you always use
         # the latest CDN version of a public module.
    

Each files/folders located under the `./client/libs/` directory of your project 
are made available to the client's browser by **Rocket** via the `require()` command.
The modules are referenced by their relative path from the `./client/js/` 
folder.

e.g. To require a module located at ./clients/js/a.js from the browser:

    var a = require(['./a'], function(a) { /* ... */ });
    
The modules can also be located further down the `./client/js` directory tree.
Hence you can require the file located at `./client/js/nested/dirs/b.js` by 
doing :
    
    //NB do **NOT** put the `.js` after the filename !!
    var myModuleFct = require(['./client/libs/nested/dirs/b'], function(b) { /* ... */ });

Usual _RequireJS_ conventions apply to the modules.  

#### Using jade templates in the browser

In view of reducing the friction between the programmer and its environment
to a minimum, rocket allows the use of jade templates on the client side.

To do so, simply put all you jade partials files in the `client/js/view`
directory and let rocket compile, and bundle those for you to use in the browser.

To use your template, simply require it and use it !

e.g. To use the template located at `client/js/views/dialog.jade` you do :
 
    require(['jade-runtime', 'views/dialog.jade'], function(__, dialog) {
    
      var html  = dialog({ title: 'Hello World !', message: 'This works!!' })
        ;
        
      /* now use your compiled template ! */
     
    );

#### Requiring javascript files from a CDN via require.config.json

In order to speedup page loads and to further comply to DRYness principles, 
rocket allows you to use CDN modules as if they were local, making sure you can
still benefit from all the requireJS optimizations.

To do so you simply need to list those modules in your require.config.json file
located at the root of your `client/js` directory.

E.g. to use the google's CDN jquery, jquery-ui and cdnJS's version of underscore,
you'd need the following definitions in your require.config.json file :

    {
        "paths" : {
            "jquery"      : "https://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min"
          , "jqueryui"    : "https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min"
          , "underscore"  : "https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.1.7/underscore-min"
        }
    }

Note that we omitted '.js' extension for the modules...

#### Production mode & Optimizations

To further optimize browser load times, you can start rocket in production mode
by defining the following environment variable at start:

     NODE_ENV='production'
     
When in production mode, rocket (1) bundles all your javascript client files at 
the root of your `client/js` directory with their dependencies, and then uglifies
them.

Thus, when those are used on the browser, only one request is needed to fetch them.

Rocket also (2) bundles your CSS files by resolving their @import statement.
The resulting CSS files are also minified.

Note that since your client jade template are compiled before being sent to the
browser, they are optimized too !

All those optimizations are provided by RequireJS r.js utility.

### Serving static files via ./client/static

All files located under the `./client/static/` directory are statically served
by **Rocket** under the `http://example.com/static/` URL.

Putting forth the use of conventions common to all **Rocket** projects, every 
project is initially created with the following files/dirs in `./client/static/`:

    ./client/static/
    |
    |-- font
    |
    |-- img
    |
    |-- apple-touch-icon.png
    |
    |-- favicon.ico


## Controllers

By using a modified version of the powerful [express-resource](https://github.com/visionmedia/express-resource "Express Resource - GitHub") plugin, **Rocket** provides
you with a robust way of automatically mapping your _controllers_ to your _routes_.

Each time you launch your application, **Rocket** takes all the `./controllers/[controller_name]_controller.js`
modules, and maps their exported functions as follows :

    GET     /[controller_name]              ->  index
    GET     /[controller_name]/new          ->  new
    POST    /[controller_name]              ->  create
    GET     /[controller_name]/:forum       ->  show
    GET     /[controller_name]/:forum/edit  ->  edit
    PUT     /[controller_name]/:forum       ->  update
    DELETE  /[controller_name]/:forum       ->  destroy

e.g.: 

    GET     /forums              ->  require('./controllers/forums_controller').index
    GET     /forums/new          ->  require('./controllers/forums_controller').new
    POST    /forums              ->  require('./controllers/forums_controller').create
    GET     /forums/:forum       ->  require('./controllers/forums_controller').show
    GET     /forums/:forum/edit  ->  require('./controllers/forums_controller').edit
    PUT     /forums/:forum       ->  require('./controllers/forums_controller').update
    DELETE  /forums/:forum       ->  require('./controllers/forums_controller').destroy
    
Where **{index, new, create, show, edit, update, destroy}** are normal _express_
callbacks functions :

    function(req,res) { /* ... */ }
    
It is important to note that

    ./controllers/root_controller.js

is used as the `/` controller.

For more info see the [express-resource readme](https://github.com/visionmedia/express-resource "Express Resource - GitHub").

### Conventions on controller names

Controller names must :

* be plural
* be all lower case
* be underscored
* have a *_controller* suffix

Hence, 

* `./controller/hyper_beams_controller.js`
    
is valid whereas

* `./controller/hyper_beams.js` 
* and  `./controller/hyper_beam_controller.js`

are not.

### Defining custom actions for your controllers

In cases where you might need to derive from the RESTful conventions, **Rocket**
provides to  you a way to add custom actions to your controllers by mapping any
exported function but {index, new, create, show, edit, update, destroy} as follows:

    {GET, POST, PUT, DELETE}  /[controller_name]/myAction  --------------->  myAction

You can also be more specific in your mapping by making `myAction` an object:
    
    GET     /[controller_name]/myAction/ --------------------------------->  myAction.get
            /[controller_name]/myAction/:[singular_controller_name] ------>  myAction.get
    
    POST    /[controller_name]/myAction/ --------------------------------->  myAction.post
            /[controller_name]/myAction/:[singular_controller_name] ------>  myAction.post
    
    PUT     /[controller_name]/myAction/ --------------------------------->  myAction.put
            /[controller_name]/myAction/:[singular_controller_name] ------>  myAction.put
            
    DELETE  /[controller_name]/myAction/ --------------------------------->  myAction.destroy
            /[controller_name]/myAction/:[singular_controller_name] ------>  myAction.destroy

### Exporting functions of a controller without mapping them to a route

By default *Rocket* ignores all exported functions prefixed with an underscore `_`.

This can be used for example if you want to be able to `require()` and extend a
*base* controller from which you want to inherit some property or methods.

### Auto-loading resource for your controller

It is possible -- via express-resource -- to *auto-load* the data associated with
a specific `id` for your controller to use.

Simply put, this can be done by exporting the function in question as`_load` in 
the controller module.

Auto-loading functions take the following form:

    exports._load = function(id, cb) {
      var err
        , obj
        ;
        
      //(1) -- load the object with the specified id
      
      //(2) -- call the callback
      cb(err, obj);
    }

For more info see [express-resource readme](https://github.com/visionmedia/express-resource "Express Resource - GitHub").

## Now.js exports

*documentation comming soon!*

## Models

Starting with version 0.1.x, rocket is database agnostic. If you're looking 
forward to using a noSQL DB, we **highly** recommend you to use [mongoDB](http://www.mongodb.org/) in 
conjunction with [mongoose](http://http://mongoosejs.com/).

## Locales

Essential to any production application is the need to have localization support.

As with controllers and views, rocket puts forward conventions that will allow
you to better manage your projects, making sure everything is at its right place.

To do so, rocket leverage the jade-i18n library by taking each javascript 
packages it finds in the `./locales` directory and then define the phrases it contains.

For example, to define the phrase *WELCOME_MESSAGE* in *en_CA* you simply create
a file named **en_CA.js** (in the `./locales` directory) containing the following:

    module.exports = {
        WELCOME_MESSAGE : 'Hello world !'
      , GOODBYE_MESSAGE : 'Bye world !'
    }
    
### Using locales in my **controllers**

One of the *suggested* pattern to better leverage jade-i18n in your controllers
is to use a middleware in order to (1) Detect the language of the client and (2)
provide a version of `rocket._` (jade-i18n `_` helper) with a pre-appended 
`lang` argument in order to allow your controllers to simply call `req._` to
translate messages in the client's language.

Such middleware would look like :

    function(req, res, next) {
      
      var current_lang = guessLang(req)
        ;
      
      req._ = function(text) {   
        return rocket._(current_lang, text);
      }
      
      next();
      
    }

### Using locales in my **views**

You can use the `_` dynamic helper just like you would with jade-i18n. 

### Using locales anywhere (else)

The jade-i18n package is available through `rocket.i18n` and its `_` dynamic
helper is available through `rocket._`

## Views

Rocket takes care of matching your views to your controllers so you do not have
to define these redundant relationship.

Controllers without view simply returns the JSON passed to `res.send()`.

### Controller/Views mapping

Rocket maps controllers to their views in the following way :

    ./controllers/root_controller.js
        |
        |- exports.index  = function(req,res) { /* ... */ } --> views/root/root.index.jade
        |
        |- exports.custom = {
               get  : function(req, res) { /* ... */ } --> views/root/root.custom.get.jade
             , post : function(req, req) { /* ... */ } --> views/root/root.custom.post.jade
           }

### Bypassing view generation with XHR queries

In order to serve as RESTful access points, every controller returns JSON
instead of its rendered view, when it is queried via XHR (ajax).
