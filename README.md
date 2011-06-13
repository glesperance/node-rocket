# THIS IS A WORK IN PROGRESS
  node-rocket is in its early stage at the moment. This message will be removed
  when it will be suitable for *unstable but less chaotic* use.
  
# Rocket (node-rocket) 

  <img src="https://github.com/glesperance/node-rocket/raw/master/libs/logo.png" width="200" alt="Node Rocket Rocks!" />
  The rapid development framework for node.js web apps.

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
    |    # partials/helpers.
    |
    |- launcher.js

## Client
### Directory Structure of the `Client` directory

    ./client/
    |
    |-- libs
    |    # Contains all the javascript files that are exported (through browserify)
    |    # to the client. All these files can then be accessed via `require()`
    |
    |-- static
         # Contains all your static files.

### Allow the browser to `require()`  your javascript modules with `./client/libs/`

### Serving static files via `./client/static`

## Controllers

### Setting up your `/` controller via `./controllers/root_controller.js`

### Setting up other controllers via `./controllers/[controller name]_controller.js`

### Defining custom routes for your controllers

#### Nesting controllers

## Exports

### Exporting remote functions/objects to the client via `./exports/`

### Calling your exported functions from the client -- or browser.

## Models

### Making worry free models using `CouchDBResource` 

* Automatically creates DB in accordance with `model.name`
* Automatically SYNC your `_design` documents (or views, lists, updates, shows, etc)
* Automatically SYNC your _security document
* Automatically validates your documents on the server using `model.schema` and `validate_doc_update`

#### Using `model.schema` to leverage `Rocket` automatic validation procedures

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
