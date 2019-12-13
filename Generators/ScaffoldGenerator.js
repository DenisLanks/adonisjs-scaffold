'use strict'

const BaseGenerator = require('./BaseGenerator')
const path = require('path')
const Ioc = require('@adonisjs/fold').ioc
const Helpers = Ioc.use('Helpers')
const Config = Ioc.use('Config')
const inflect = require('inflect')
const yaml = require('yamljs')

class ScaffoldGenerator extends BaseGenerator {
  constructor () {
    super(Helpers)
  }

  * makeController (name, fields) {
    const entity = this._makeEntityName(name, 'controller', true)
    const shortName = entity.entityName.split('Controller')[0]
    const table = this._makeEntityName(name, '', false, 'plural')
    const toPath = path.join(this.helpers.appPath(), 'Http/Controllers', `${entity.entityPath}.js`)

    const arrayStringField = []

    for (var key in fields) {
      arrayStringField.push(key)
    }

    const templateOptions = {
      methods: ['index', 'create', 'store', 'show', 'edit', 'update', 'destroy'],
      resource: true,
      name: entity.entityName,
      shortName: shortName,
      shortNameLower: shortName.toLowerCase(),
      fields: arrayStringField.join("','"),
      table: table.entityName.toLowerCase()
    }
    yield this._wrapWrite('controller', toPath, templateOptions, '.njk')
  }

  * makeModel (name, fields, object) {
    const entity = this._makeEntityName(name, 'model', false, 'singular')
    const table = this._makeEntityName(name, '', false, 'plural')
    const toPath = path.join(this.helpers.appPath(), 'Model', `${entity.entityPath}.js`)
    const template = 'model'
    const templateOptions = {
      name: entity.entityName,
      table: table.entityName.toLowerCase(),
      fields,
      relations: this.parseRelation(object.relation)
    }
    try {
      yield this.write(template, toPath, templateOptions, '.njk')
      this._success(toPath)
      yield this.makeMigration(name, table.entityName.toLowerCase(), fields)
    } catch (e) {
      this._error(e.message)
    }
  }

  parseRelation (relations) {
    if (relations) {
      for (var i = 0; i < relations.length; i++) {
        if (relations[i].name === '') {
          const relatedModel = relations[i].relatedmodel
          if (relations[i].relationtype === 'belongsTo') {
            const method = this._makeEntityName(relatedModel, '', false, 'singular')
            relations[i].name = inflect.camelize(method.entityName)
          } else {
            const method = this._makeEntityName(relatedModel, '', false, 'plural')
            relations[i].name = inflect.camelize(method.entityName)
          }
          relations[i].relatedmodel = inflect.camelize(relatedModel)
        }

        if (relations[i].usenamespace === '') {
          relations[i].usenamespace = 'App/Model'
        }
      }
    } else {
      relations = []
    }

    return relations
  }

  * makeRepository (name) {
    const entity = this._makeEntityName(name, 'model', false, 'singular')
    const table = this._makeEntityName(name, '', false, 'plural')
    const toPath = path.join(this.helpers.appPath(), 'Repositories', `${entity.entityPath}.js`)
    const template = 'repository'
    const templateOptions = {
      name: entity.entityName,
      lowerName: entity.entityName.toLowerCase(),
      table: table.entityName.toLowerCase()
    }
    try {
      yield this.write(template, toPath, templateOptions, '.njk')
      this._success(toPath)
    } catch (e) {
      this._error(e.message)
    }
  }

  * makeService (name) {
    const entity = this._makeEntityName(name, 'model', false, 'singular')
    const table = this._makeEntityName(name, '', false, 'plural')
    const toPath = path.join(this.helpers.appPath(), 'Services', `${entity.entityPath}.js`)
    const template = 'service'
    const templateOptions = {
      name: entity.entityName,
      lowerName: entity.entityName.toLowerCase(),
      table: table.entityName.toLowerCase()
    }
    try {
      yield this.write(template, toPath, templateOptions, '.njk')
      this._success(toPath)
    } catch (e) {
      this._error(e.message)
    }
  }


  * makeTest (name, fields) {
    const entity = this._makeEntityName(name, 'model', false, 'singular')
    const table = this._makeEntityName(name, '', false, 'plural')
    const toPath = path.join(this.helpers.basePath(), 'tests', 'unit', `${entity.entityPath}.spec.js`)
    const template = 'test_spec'
    const arrayStringField = []

    for (var key in fields) {
      arrayStringField.push(key)
    }

    const templateOptions = {
      shortName: entity.entityName,
      lowerName: entity.entityName.toLowerCase(),
      tableName: table.entityName.toLowerCase(),
      firstField: arrayStringField[0],
      fields
    }

    try {
      yield this.write(template, toPath, templateOptions, '.njk')
      this._success(toPath)
    } catch (e) {
      this._error(e.message)
    }
  }

  * makeView (name, fields) {
    try {
      const entity = this._makeEntityName(name, 'view', false)
      const table = this._makeEntityName(name, '', false, 'plural')
      const controllerEntity = this._makeEntityName(name, 'controller', true)
      const files = ['index', 'show', 'create', 'edit', 'field']

      for (var i = 0; i < files.length; i++) {
        const toPath = path.join(this.helpers.viewsPath(), `${table.entityName.toLowerCase()}`, `${files[i]}.njk`)
        const template = `view_${files[i]}`
        const templateOptions = {
          objectDb: entity.entityName.toLowerCase(),
          fields,
          name: entity.entityName,
          controllerName: controllerEntity.entityName,
          route: table.entityName.toLowerCase()
        }
        yield this._wrapWrite(template, toPath, templateOptions, '.ejs')
      }
    } catch (e) {
      this._error(e.message)
    }
  }

  * makeMigration (name, tableName, fields) {
    const entity = this._makeEntityName(name, 'migration', false)
    const toPath = this.helpers.migrationsPath(`${new Date().getTime()}_${name}.js`)
    const template = 'migration'
    const templateOptions = {
      table: tableName,
      name: entity.entityName,
      fields
    }
    yield this._wrapWrite(template, toPath, templateOptions, '.njk')
  }

  static get signature () {
    return 'scaffold'
  }

  static get description () {
    return 'Scaffold make easier generate with template'
  }

  async generate(schema){
    const name = schema.name
    const fields = schema.fields
    this.makeModel(name, fields, schema)
    this.makeController(name, fields)
    this.makeRepository(name)
    this.makeView(name, fields)
    this.makeTest(name, fields)
  }

  async handle (args, options) {
    // Chose the source of scaffold
    let source = await this.choice('Source of scaffold',['Database','Yml']);
    let object = {};
    switch (source) {
      case 'Database':{

        //ask for connection name
        const name = await this
        .ask('Enter connection name');

        let path = `database.${name}`;
        let configs = Config.get(path,false);
        if (configs == false) {
          console.log('Database config not found!');
          return
        }

        let databaseService = {};
        switch (configs.client) {
          case 'pg':{
            //generate scaffold from postgres database
            console.log('Database config founded! Client postgres')
            const PostgresService = require('../Services/PostgresService');
            databaseService = new PostgresService()
            databaseService.connect(name)
          } break;

          case 'oracledb':{
            //generate scaffold from postgres database
            console.log('Database config founded! Client oracledb')
            const OracleService = require('../Services/OracleService');
            databaseService = new OracleService()
            databaseService.connect(name)
          } break;

          default:{
            console.log('unsupported database client');
            return;
          }
        }

        let schemas = await databaseService.getSchemas();

        //let user choice which schema we will scaffold
        let schema = await this.choice('schema to scaffold',schemas);
        console.debug(`the selected schema was ${schema}`);

        //Convert to Yml object
        object = await databaseService.toYmlSchema(schema);

        //console.log(JSON.stringify(object));

        databaseService.disconnect()

        //for each table founded generate the
        for (let i = 0; i < object.length; i++) {
          const schema = object[i];
          await this.generate(schema);
        }

      } break;

      case 'Yml':{
        try {
          const name = await this
          .ask('Enter yml name');
          object = yaml.load(path.join(this.helpers.appRoot(), name + '.yml'))
          console.log(JSON.stringify(object));
          //this.generate(object);
        } catch (e) {
          this._error(e.message)
        }
      } break;
    }


    this.success("Ayee finished build , let's code")
  }
}

module.exports = ScaffoldGenerator
