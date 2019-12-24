# adonisjs-scaffold
adonisjs-scaffold is a package to generate scaffold from *.yml, database and json(soon). This is a fork and rewrite from [adonis-generator](https://github.com/zainul/adonis-generator), with support to generate from database and json.

#Support
adonisjs-scaffold support Postgresql, Oracle, Mysql(soon), MSSQL(soon) and Sqlite(soon).

#Installation
***incomplete**

Install on your project typing 
``
npm i /adonis-scaffold
``

Add to **commands** in **start/app.js** 
``
adonis-scaffold/Generators/ScaffoldGenerator
``


#Getting Started
After installation and setup run on terminal:

``
adonis scaffold
``

the message will be showed:
> Source of scaffold (Use arrow keys)
  Database
  Yml

select the option you want

##Yml
If you choose Yml type the name of file without extension. The file must be on root directory
> Enter yml name

> Enter yml name test
**create:** C:\Users\Usuario\source\generator\Models\Box.js
**create:** C:\Users\Usuario\source\generator\Repositories\BoxRepository.js
**create:** C:\Users\Usuario\source\generator\Services\BoxService.js
**create:** C:\Users\Usuario\source\generator\tests\unit\Box.spec.js

##Database
If you choose Database, the connection name is required.
> Enter connection name 

Type the connection name to list the schema:
Database config founded! Client oracledb
> schema to scaffold (Use arrow keys)
  XS$NULL
  ANONYMOUS
  APEX_PUBLIC_USER
  TEST

Choose the schema to use and look to output
>**create:** C:\Users\Usuario\source\generator\Models\Box.js
**create:** C:\Users\Usuario\source\generator\Repositories\BoxRepository.js
**create:** C:\Users\Usuario\source\generator\Services\BoxService.js
**create:** C:\Users\Usuario\source\generator\tests\unit\Box.spec.js

#Args and Options

``
--export-Models
``
Export the models to json, use this flag to export the model and edit some things. The models will be exported to "models.json". The file will be overwrited if exists.

``
--log
``
