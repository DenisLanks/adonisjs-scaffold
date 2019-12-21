'use strict'

const BaseGenerator = require('./BaseGenerator')
const path = require('path')
const Ioc = require('@adonisjs/fold').ioc
const Helpers = Ioc.use('Helpers')
const Config = Ioc.use('Config')
const inflect = require('inflect')
const yaml = require('yamljs')

class ScaffoldGenerator extends BaseGenerator {
  constructor() {
    super(Helpers)
  }

  async makeController(name, fields) {
    const entity = this._makeEntityName(name, 'controller', true)
    const shortName = entity.entityName.split('Controller')[0]
    const table = this._makeEntityName(name, '', false, 'plural')
    const toPath = path.join(this.helpers.appRoot(), 'Http/Controllers', `${entity.entityPath}.js`)

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
    await this._wrapWrite('controller', toPath, templateOptions, '.njk')
  }

  async makeModel(name, fields, object) {
    const entity = this._makeEntityName(name, 'model', false, 'singular');
    const table = this._makeEntityName(name, '', false, 'plural');
    const toPath = path.join(this.helpers.appRoot(), 'Models', `${entity.entityPath}.js`);
    const template = 'model'
    const templateOptions = {
      name: entity.entityName,
      table: table.entityName.toLowerCase(),
      fields,
      relations: this.parseRelation(object.relation)
    }
    try {
      await this.write(template, toPath, templateOptions, '.njk')
      this._success(toPath)
      await this.makeMigration(name, name/*table.entityName.toLowerCase()*/, fields)
    } catch (e) {
      this._error(e.message)
    }
  }

  parseRelation(relations) {
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

        if (relations[i].usenamespace === '' || relations[i].usenamespace === undefined) {
          relations[i].usenamespace = 'App/Models'
        }
      }
    } else {
      relations = []
    }

    return relations
  }

  async makeRepository(name) {
    const entity = this._makeEntityName(name, 'model', false, 'singular')
    const table = this._makeEntityName(name, '', false, 'plural')
    const toPath = path.join(this.helpers.appRoot(), 'Repositories', `${entity.entityPath}Repository.js`)
    const template = 'repository'
    const templateOptions = {
      name: entity.entityName,
      lowerName: entity.entityName.toLowerCase(),
      table: table.entityName.toLowerCase()
    }
    try {
      await this.write(template, toPath, templateOptions, '.njk')
      this._success(toPath)
    } catch (e) {
      this._error(e.message)
    }
  }

  async makeService(name) {
    const entity = this._makeEntityName(name, 'model', false, 'singular')
    const table = this._makeEntityName(name, '', false, 'plural')
    const toPath = path.join(this.helpers.appRoot(), 'Services', `${entity.entityPath}Service.js`)
    const template = 'service'
    const templateOptions = {
      name: entity.entityName,
      lowerName: entity.entityName.toLowerCase(),
      table: table.entityName.toLowerCase()
    }
    try {
        await this.write(template, toPath, templateOptions, '.njk')
      this._success(toPath)
    } catch (e) {
      this._error(e.message)
    }
  }


  async makeTest(name, fields) {
    const entity = this._makeEntityName(name, 'model', false, 'singular')
    const table = this._makeEntityName(name, '', false, 'plural')
    const toPath = path.join(this.helpers.appRoot(), 'tests', 'unit', `${entity.entityPath}.spec.js`)
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
        await this.write(template, toPath, templateOptions, '.njk')
      this._success(toPath)
    } catch (e) {
      this._error(e.message)
    }
  }

  async makeView(name, fields) {
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
         await this._wrapWrite(template, toPath, templateOptions, '.ejs')
      }
    } catch (e) {
      this._error(e.message)
    }
  }

  async makeMigration(name, tableName, fields) {
    const entity = this._makeEntityName(name, 'migration', false)
    const toPath = this.helpers.migrationsPath(`${new Date().getTime()}_${name}.js`)
    const template = 'migration'
    const templateOptions = {
      table: tableName,
      name: entity.entityName,
      fields
    }
    await this._wrapWrite(template, toPath, templateOptions, '.njk')
  }

  static get signature() {
    return 'scaffold'
  }

  static get description() {
    return 'Scaffold make easier generate with template'
  }

  async generate(schema) {
    const name = schema.name
    const fields = schema.fields
    await this.makeModel(name, fields, schema)
    await this.makeController(name, fields)
    await this.makeRepository(name)
    await this.makeService(name)
    await this.makeView(name, fields)
    await this.makeTest(name, fields)
  }

  async handle(args, options) {
    // Chose the source of scaffold
    let source = await this.choice('Source of scaffold', ['Database', 'Yml']);
    let object = {};
    switch (source) {
      case 'Database': {

        //ask for connection name
        const name = await this
          .ask('Enter connection name');

        let path = `database.${name}`;
        let configs = Config.get(path, false);
        if (configs == false) {
          console.log('Database config not found!');
          return
        }

        let databaseService = {};
        switch (configs.client) {
          case 'pg': {
            //generate scaffold from postgres database
            console.log('Database config founded! Client postgres')
            const PostgresService = require('../Services/PostgresService');
            databaseService = new PostgresService()
            databaseService.connect(name)
          } break;

          case 'oracledb': {
            //generate scaffold from postgres database
            console.log('Database config founded! Client oracledb')
            const OracleService = require('../Services/OracleService');
            databaseService = new OracleService()
            databaseService.connect(name)
          } break;

          default: {
            console.log('unsupported database client');
            return;
          }
        }

        let schemas = await databaseService.getSchemas();

        //let user choice which schema we will scaffold
        let schema = await this.choice('schema to scaffold', schemas);
        await databaseService.buildSchema(schema);
        databaseService.disconnect()
        object = await databaseService.buildModels();

        // console.log(JSON.stringify(object));


        //for each table founded generate the
        for (const id in object) {
          await this.generate(object[id]);
        }

      } break;

      case 'Yml': {
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


    //this.success("Ayee finished build , let's code")
  }
}

module.exports = ScaffoldGenerator
