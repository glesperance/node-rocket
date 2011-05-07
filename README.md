# Node-Rocket 

  <img src="https://github.com/glesperance/node-rocket/raw/master/libs/logo.png" width="200" alt="Node Rocket Rocks yo!" />
  The rapid development framework for node.js web apps.

## Installation

    $ npm install rocket

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
  
  If you want to create the sample `hello_world` project use the 
  `-t` template as argument. It will create a project named `HelloWorld` in the current directory.
  
    $ rocket create -t hello_world HelloWorld
   
  To add all the necessary files for a new page/controller you can user `add`. It will also make sure you are in
  the root of your project.
    $ rocket add pageName
   
## Directory Sructure of *default* a rocket-project

    ./MyRocketProject/
    |
    |-- client
    |    |-- css
    |    |
    |    |-- libs
    |    |    |-- bootstrapers
    |    |    |     |- default_bootstraper.js
    |    |    |     
    |    |    |- jquery.min.1.5.x.js
    |    |
    |    |-- static
    |         |- favicon.ico
    |         |- apple-touch-icon.png
    |
    |-- controllers
    |     |- messages_controller.js
    |
    |-- exports
    |     |- ping_receiver.js
    |
    |-- models
    |
    |-- views
    |     |- layout.jade
    |
    |- config.json
    |- app.js

### client

  This directory contains all the files which are sent or directly accessible by
  the client.
  
#### libs

  In this directory are stored all the javascript files that are used by the
  client. Currently, *Node-Rocket* uses *browserify* in order to make each of
  these files accessible to the client via the `require` command.
  
  e.g.:
    
    require('jquery.min.1.5.x");

##### bootstrapers

##### Boot sequence



  
  
