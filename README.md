# THIS IS A WORK IN PROGRESS
  node-rocket is in its early stage at the moment. This message will be removed
  when it will be suitable for *unstable but less chaotic* use.

## Lastest dev notes
  * rocket_main.js has been re-written, it is much easier to read now
  * Views no longer require view in their name (as they already are in a view folder and have a .jade extension, it was getting lengthy for little reason) <-- build script needs to be fixed to incorporate this change
  * Folders the plugins directory are loaded as complete apps as long as they do not have conflicting URLs with the main app
  * Currently plugin's can export functions through dnode, but their bootstrapping JavaScript files do not work, this currently lacks a proper solution, as I want to keep plugin client code separate from the main client code

  
# node-rocket 

  <img src="https://github.com/glesperance/node-rocket/raw/master/libs/logo.png" width="200" alt="Node Rocket Rocks!" />
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
   
  You can also create create new controllers by using the `add` command while being *in your project directory* :
    $ rocket add pageName
   
## Directory Sructure of a Rocket Project

    ./MyRocketProject/
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
    |-- views
    |    # Contains your applications's main layout, template files and associated
    |    # partials/helpers.
    |
    |- launcher.js

