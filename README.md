# @lanks/adonisjs-scaffold
adonisjs-scaffold is a package to generate scaffold from **yml**, **database** and **json**. This is a fork and rewrite from [adonis-generator](https://github.com/zainul/adonis-generator), with support to generate from database and json.

# Support  
adonisjs-scaffold support Postgresql, Oracle(partial), Mysql(partial), MSSQL(soon) and Sqlite(soon).

# Installation  
Install on your project typing 
``
npm i @lanks/adonis-scaffold
`` 
   
# Setup  
Add to **commands** in **start/app.js** 
``
@lanks/adonis-scaffold/Generators/ScaffoldGenerator
``


# Getting Started
After installation and setup run on terminal:

``
adonis scaffold
``

the message will be showed:
> Source of scaffold (Use arrow keys)  
 Database  
 Json  
 Yml

select the option you want

## Yml  
If you choose Yml, type the name of file without extension. The file must be on root directory
> Enter yml name

> Enter yml name test  
**create:** C:\Users\Usuario\source\generator\Models\Box.js  
**create:** C:\Users\Usuario\source\generator\Repositories\BoxRepository.js  
**create:** C:\Users\Usuario\source\generator\Services\BoxService.js  
**create:** C:\Users\Usuario\source\generator\tests\unit\Box.spec.js  

## JSON
If you choose Json, type the name of file without extension. The file must be on root directory
> Enter json name

> Enter json name test   

Select the models to scaffold  
>**Tables to scaffold**  
**(*)** box   
**( )** sphere   
**( )** brands   
**( )** cashiers  
(Move up and down to reveal more choices)  

look to output  

>**create:** C:\Users\Usuario\source\generator\Models\Box.js  
**create:** C:\Users\Usuario\source\generator\Repositories\BoxRepository.js  
**create:** C:\Users\Usuario\source\generator\Services\BoxService.js  
**create:** C:\Users\Usuario\source\generator\tests\unit\Box.spec.js  

## Database
If you choose Database, the connection name is required.
> Enter connection name 

Type the connection name to list the schema:
>Database config founded! Client oracledb  
 schema to scaffold (Use arrow keys)  
 XS$NULL  
 ANONYMOUS  
 APEX_PUBLIC_USER  
 TEST  

Choose the schema to use

Select the tables to scaffold  
>**Tables to scaffold**  
**(*)** box   
**( )** sphere   
**( )** brands   
**( )** cashiers  
(Move up and down to reveal more choices)  

look to output  


>**create:** C:\Users\Usuario\source\generator\Models\Box.js  
**create:** C:\Users\Usuario\source\generator\Repositories\BoxRepository.js  
**create:** C:\Users\Usuario\source\generator\Services\BoxService.js  
**create:** C:\Users\Usuario\source\generator\tests\unit\Box.spec.js  

# Args and Options

``
--no-migrations
``  
Prevent the scaffold generate migrations files.

``
--no-views
``  
Prevent the scaffold generate views files.

``
--export-Models
``  
Export the models to json, use this flag to export the model and edit some things. The models will be exported to "models.json". The file will be overwrited if exists.

``
--log
``  
# Coming Soon    
  Support to MSSql - **Pending**  
  Support to Sqlite - **Pending**  
  Generate code from custom templates. - **Started**  
