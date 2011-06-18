# Rocket (node-rocket) : The rapid development framework for  node.js-couchDB real-time/comet web applications

RocketJS.net a.k.a. node-Rocket [1] is a project created by Gabriel Lespérance during the “Startupfier Summer Kick-off: Hackathon” [2] in order to allow rapid development of comet/real-time web applications using node.js [3] and couchDB [4]. <img src="https://github.com/glesperance/node-rocket/raw/master/libs/logo.png" width="200" alt="Node Rocket Rocks!" />

Highly inspired by Ruby on Rails [5] and cakePHP [6], Rocket puts forward the convention over configuration principle [7] in order to simplify and speedup the software development process and allow easier scalability by leveraging node.js asynchronous behavior as well as couchDB distributed nature. 

Central to RocketJS is the principle of having a single point of contact between the programmer and the underlying application and resources. Hence, RocketJS aims to blur and reduce as much as possible the separation between the client (browser), the server (node.js) and the database (couchDB) while maximizing the scaling potential -- for instance by allowing code sharing between couchDB and the server, and between the server and the client -- and improving the performance of the resulting web application.  

Built on top of express [8] -- node.js’ high performance web development framwork -- RocketJS provides a robust structure on which to build your web applications without sacrificing all any of your freedom.

### RocketJS Features
* Automatic routing of your controllers
* Automatic mapping of your views to their corresponding controller
* Automatic creation of your couchDB databases based on your models’ definitions
* Automatic synchronization of your couchDB design documents with your server models
* Automatic document validation based on your model’s schemas via couchDB `validate_doc_update`
* Easy web-socket / comet application support through dnode [9]
* Easy server / client code sharing allowing the client to  use CommonJS [10] `require()` command to import/use server JS libraries
* High focus on RESTful controller conventions
* Rails-like `form_tag` and `form_for` form generation
* View rendering and partials support
* Connect [11] middleware support
* Built on top of express

## Installation

    $ npm install rocket
   
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
    |-- models
    |    # Contains all your applications's models and dataasources.
    |
    |-- plugins
    |     # Contains all your application's plugins.
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
    |-- libs
    |    # Contains all the javascript files that are exported (through browserify)
    |    # to the client. All these files can then be accessed via `require()`
    |
    |-- static
         # Contains all your static files.

### Allow the browser to require() your javascript modules with ./client/libs/

Each files/folders located under the `./client/libs/` directory of your project 
are made available to the client's browser by **Rocket** via the `require()` command.
The modules are referenced by their relative path from the `./client/libs/` 
folder.

e.g. To require a moduled located at ./clients/libs/a.js from the browser:

    var a = require('./a');
    
The modules can also be located further down the `./client/libs` directory tree.
Hence you can require the file located at `./client/libs/nested/dirs/b.js` by 
doing :

    var myModuleFct = require('./client/libs/nested/dirs/b').myModuleFct;

Usual _CommonJS_ conventions apply to the modules.  

### Serving static files via ./client/static

All files located under the `./client/static/` directory are statically served
by **Rocket** under the `http://example.com/static/` URL.

Putting forth the use of conventions common to all **Rocket** projects, every 
project is initally created with the following files/dirs in `./client/static/`:

    ./client/static/
    |
    |-- css
    |
    |-- font
    |
    |-- img
    |
    |-- apple-touch-icon.png
    |
    |-- favicon.ico


## Controllers

By using a modified version of the powerfull [express-resource](https://github.com/visionmedia/express-resource "Express Resource - GitHub") plugin, **Rocket** provides
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

    {GET, POST, PUT, DELETE}  /[controller_name]/myAction  ->  myAction

You can also be more specific in your mapping by making `myAction` an object:
    
    GET     /[controller_name]/myAction/    --\
            /[controller_name]/myAction/:id ---\-->  myAction.get
    
    POST    /[controller_name]/myAction/    --\
            /[controller_name]/myAction/:id ---\-->  myAction.post
    
    PUT     /[controller_name]/myAction/    --\
            /[controller_name]/myAction/:id ---\-->  myAction.put
            
    DELETE  /[controller_name]/myAction/    --\
            /[controller_name]/myAction/:id ---\-->  myAction.destroy

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

### Nesting controllers

You can nest controllers by leveraging `app.rocket.controllers` and the *express-resource* `add` 
function in your `./launcher.js` file :

    /****************************************************************
     * LAUNCHER.JS
     */
    var rocket = require('rocket')
      , LISTEN_PORT = 80
      , app = rocket.createServer(__dirname)
      ;
      
    app.listen(LISTEN_PORT);
    
    //Nest the `children` controller under the `parents` controller.
    app.rocket.controllers.parents.add(app.rocket.controllers.children);

## Dnode exports

### Exporting remote functions/objects to the client via ./exports/

### Calling your exported functions from the client -- or browser.

## Models

### Making worry free models using CouchDBResource

* Automatically creates DB in accordance with model.name
* Automatically SYNC your _design documents (or views, lists, updates, shows, etc)
* Automatically SYNC your _security document
* Automatically validates your documents on the server using model.schema and validate_doc_update

#### Using model.schema to leverage Rocket automatic validation procedures

#### How to invoke your couchDB views

#### Creating your own validators using `validate_doc_update`

##### How to properly `throw` errors for the rocket form helper

#### Creating a `datasource` to keep it DRY !

## Views

### Controller/Views mapping

### bypassing view generation with XHR queries

### Using the `form_tag` helper

#### `select_tag`
##### `fields_for_select`
#### `label_tag`
#### `text_field_tag`
#### `text_area_tag`
#### `password_field_tag`
#### `hidden_field_tag`
#### `radio_button_tag`
#### `check_box_tag`
#### `file_field_tag`
#### `submit_tag`

## Plugins

## Usage
  
    Usage: rocket [OPTIONS] ARGUMENTS

    Arguments:
      create NAME_OF_YOUR_PROJECT    create a rocket project (Shouldn't exist)
      add PAGE_NAME                  add a new page to the project (From the root of your project)
    Options:
      -v, --verbose                  show what's under the rocket.
      -h, --help                     show this message.


  To get started you first need to create a new project using the `rocket`
  command.
    
    $ rocket create [Project Name]
    
  For example, if you want to create a project named `MyRocketProject` that uses
  the *default* template you do :
  
    $ rocket create MyRocketProject
   
  You can also create create new controllers by using the `add` command while being *in your project directory* :
    $ rocket add pageName
