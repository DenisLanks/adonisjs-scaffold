"use strict";

const BaseGenerator = require("./BaseGenerator");
const path = require("path");
const Ioc = require("@adonisjs/fold").ioc;
const Helpers = Ioc.use("Helpers");
const Config = Ioc.use("Config");
const inflect = require("inflect");
const yaml = require("yamljs");
const fs = require('co-fs-extra')

class ScaffoldGenerator extends BaseGenerator {
  constructor() {
    super(Helpers);
    this.stack = [];
  }

  /**
   * Generate the controller
   * @param {String} name
   * @param {Object} fields
   */
  async makeController(name, fields) {
    const entity = this._makeEntityName(name, "controller", true);
    const shortName = entity.entityName.split("Controller")[0];
    const table = this._makeEntityName(name, "", false, "plural");
    const toPath = path.join(
      this.helpers.appRoot(),
      "Http/Controllers",
      `${entity.entityPath}.js`
    );

    const arrayStringField = [];

    for (var key in fields) {
      arrayStringField.push(key);
    }

    const templateOptions = {
      methods: [
        "index",
        "create",
        "store",
        "show",
        "edit",
        "update",
        "destroy"
      ],
      resource: true,
      name: entity.entityName,
      shortName: shortName,
      shortNameLower: shortName.toLowerCase(),
      fields: arrayStringField.join("','"),
      table: table.entityName.toLowerCase()
    };
    await this._wrapWrite("controller", toPath, templateOptions, ".njk");
  }

  /**
   * Generate the model
   * @param {String} name
   * @param {Object} fields
   * @param {Object} object
   */
  async makeModel(name, fields, object) {
    const entity = this._makeEntityName(name, "model", false, "singular");
    const table = this._makeEntityName(name, "", false, "plural");
    const toPath = path.join(
      this.helpers.appRoot(),
      "Models",
      `${entity.entityPath}.js`
    );
    const template = "model";
    const templateOptions = {
      name: entity.entityName,
      table: table.entityName.toLowerCase(),
      fields,
      relations: this.parseRelation(object.relation)
    };
    try {
      await this.write(template, toPath, templateOptions, ".njk");
      this._success(toPath);
      //await this.makeMigration(name, name/*table.entityName.toLowerCase()*/, fields)
    } catch (e) {
      this._error(e.message);
    }
  }

  parseRelation(relations) {
    if (relations) {
      for (var i = 0; i < relations.length; i++) {
        if (relations[i].name === "") {
          const relatedModel = relations[i].relatedmodel;
          if (relations[i].relationtype === "belongsTo") {
            const method = this._makeEntityName(
              relatedModel,
              "",
              false,
              "singular"
            );
            relations[i].name = inflect.camelize(method.entityName);
          } else {
            const method = this._makeEntityName(
              relatedModel,
              "",
              false,
              "plural"
            );
            relations[i].name = inflect.camelize(method.entityName);
          }
          relations[i].relatedmodel = inflect.camelize(relatedModel);
        }

        if (
          relations[i].usenamespace === "" ||
          relations[i].usenamespace === undefined
        ) {
          relations[i].usenamespace = "App/Models";
        }
      }
    } else {
      relations = [];
    }

    return relations;
  }

  async makeRepository(name) {
    const entity = this._makeEntityName(name, "model", false, "singular");
    const table = this._makeEntityName(name, "", false, "plural");
    const toPath = path.join(
      this.helpers.appRoot(),
      "Repositories",
      `${entity.entityPath}Repository.js`
    );
    const template = "repository";
    const templateOptions = {
      name: entity.entityName,
      lowerName: entity.entityName.toLowerCase(),
      table: table.entityName.toLowerCase()
    };
    try {
      await this.write(template, toPath, templateOptions, ".njk");
      this._success(toPath);
    } catch (e) {
      this._error(e.message);
    }
  }

  async makeService(name) {
    const entity = this._makeEntityName(name, "model", false, "singular");
    const table = this._makeEntityName(name, "", false, "plural");
    const toPath = path.join(
      this.helpers.appRoot(),
      "Services",
      `${entity.entityPath}Service.js`
    );
    const template = "service";
    const templateOptions = {
      name: entity.entityName,
      lowerName: entity.entityName.toLowerCase(),
      table: table.entityName.toLowerCase()
    };
    try {
      await this.write(template, toPath, templateOptions, ".njk");
      this._success(toPath);
    } catch (e) {
      this._error(e.message);
    }
  }

  async makeTest(name, fields) {
    const entity = this._makeEntityName(name, "model", false, "singular");
    const table = this._makeEntityName(name, "", false, "plural");
    const toPath = path.join(
      this.helpers.appRoot(),
      "tests",
      "unit",
      `${entity.entityPath}.spec.js`
    );
    const template = "test_spec";
    const arrayStringField = [];

    for (var key in fields) {
      arrayStringField.push(key);
    }

    const templateOptions = {
      shortName: entity.entityName,
      lowerName: entity.entityName.toLowerCase(),
      tableName: table.entityName.toLowerCase(),
      firstField: arrayStringField[0],
      fields
    };

    try {
      await this.write(template, toPath, templateOptions, ".njk");
      this._success(toPath);
    } catch (e) {
      this._error(e.message);
    }
  }

  async makeView(name, fields) {
    if (this.options.views===false) {
      return Promise.resolve();
    } else {
      try {
        const entity = this._makeEntityName(name, "view", false);
        const table = this._makeEntityName(name, "", false, "plural");
        const controllerEntity = this._makeEntityName(name, "controller", true);
        const files = ["index", "show", "create", "edit", "field"];
  
        for (var i = 0; i < files.length; i++) {
          const toPath = path.join(
            this.helpers.viewsPath(),
            `${table.entityName.toLowerCase()}`,
            `${files[i]}.njk`
          );
          const template = `view_${files[i]}`;
          const templateOptions = {
            objectDb: entity.entityName.toLowerCase(),
            fields,
            name: entity.entityName,
            controllerName: controllerEntity.entityName,
            route: table.entityName.toLowerCase()
          };
          await this._wrapWrite(template, toPath, templateOptions, ".ejs");
        }
      } catch (e) {
        this._error(e.message);
      }
    }
  }

  getTypeMigration(type, identity) {
    if (identity === true) {
      const tokens = type.split("|");

      switch (tokens[0]) {
        case "integer": {
          tokens[0] = "increments";
          return tokens.join("|");
        }

        case "biginteger": {
          tokens[0] = "bigincrements";
          return tokens.join("|");
        }
      }
    }

    return type;
  }

  async makeMigration(name, tableName, schema) {
    const entity = this._makeEntityName(name, "migration", false);
    const toPath = this.helpers.migrationsPath(
      `${new Date().getTime()}_${name}.js`
    );
    const template = "migration";

    let fields = {};

    for (const key in schema.fields) {
      const element = schema.fields[key];
      let field = {};
      field.type = this.getTypeMigration(element.type, element.identity);
      field.unique = element.unique;
      field.unsigned = element.unsigned;
      field.nullable = element.nullable;
      fields[key] = field;
    }

    // for (const id in schema.relation) {
    //     const element = schema.relation[id];
    // }

    const templateOptions = {
      table: tableName,
      name: entity.entityName,
      fields: fields,
      autoincrement: schema.autoincrement,
      primary: schema.primary,
      indices: schema.index,
      relations: schema.relation.filter(item => {
        return item.relationtype === "belongsTo";
      })
    };
    //console.log(templateOptions);
    await this._wrapWrite(template, toPath, templateOptions, ".njk");
  }

  static get signature() {
    return `scaffold
            { --log : Print all steps }
            { --export-models : export the models to disk. }
            { --no-migrations : prevent generate migrations from database. }
            { --no-views : prevent generate views from database. }
    `;
  }

  static get description() {
    return "Scaffold make easier generate with template or from database";
  }

  /**
   * Export models to file
   * @param {Object} models
   */
  async exportModels(models) {
    return new Promise((resolve, reject) => {
      if (this.options.exportModels) {
        this._writeContents("models.json", JSON.stringify(models)).then(
          () => {
            console.log("models export successful");
          },
          error => {
            console.log(error);
          }
        );
      }
      resolve();
    });
  }

  async buildCustom(root, list, schema) {
    return new Promise(async (resolve, reject) => {
      if (!fs.exists(root)) {
        reject(`Path ${root} not found!`);
        return;
      }

      for (const filename of list) {
        let subdir = path.resolve(root, filename);
        await fs.lstat(subdir, async (err, stats) => {
          if (err) {
            console.error(err);
            return;
          }

          if (stats.isDirectory()) {
            await fs.readdir(subdir, async (err, list) => {
              if (err) {
                console.error(err);
                return;
              }
              await this.buildCustom(subdir, list, schema);
            });
          } else if (stats.isFile()) {
            let tokens = filename.split('.');
            switch (tokens.pop()) {
              case 'njk':
                await this._wrapWrite(subdir, path.resolve(root, `${schema.name}.js`), schema, ".njk");
                break;
              case 'ejs':
                console.log("EJS");
                break;
            }
          }
        });

      }

      resolve();
    });
  }
  
  async makeCustom(schema) {
    return new Promise(async (resolve, reject) => {
      //Read custom templates path
      if (this.config.customTemplate === null || this.config.customTemplate === undefined) {
        resolve();
        return;
      }

      //foreach template file on path
      if (!fs.exists(this.config.customTemplate)) {
        reject(`Path ${this.config.customTemplate} not found!`);
        return;
      }

      let exec = async (err, list) => {
        let root = path.resolve(this.config.customTemplate);
        if (err)
          console.log(err);
        await this.buildCustom(root, list, schema);
      }

      await fs.readdir(this.config.customTemplate, exec);

      resolve();
    });
  }

  generateMigration(key, models) {
    try {
      let model = models[key];

      if (model.generated === true) {
        return;
      }else{
        console.log(`model ${key} not generated.`);
        model.generated = true
        this.stack.push(key);
        console.log(`checking dependencies.`);
        let dependencies = model.relation.filter((value) => { return value.relationtype === "belongsTo"; });
        console.log(`${dependencies.length} found.`);
        if (dependencies.length > 0){
          for (const rel of dependencies) {
            console.log(`trying to generate ${rel.relatedtable}.`);
            if (key !== rel.relatedtable && !this.stack.includes(rel.relatedtable)) {
              this.generateMigration(rel.relatedtable, models);
            }
          }

          this.makeMigration(key, key, model)
          .then(()=>{
            console.log(`model ${model.name} made.`);
            this.stack.pop();
          });
          
                    
        }else{
          this.makeMigration(key, key, model)
            .then(()=>{
              console.log(`model ${model.name} made.`);
              this.stack.pop();
            });
        }
       
      }
    } catch (error) {
      return console.error(error);
    }
  }

  async generateMigrations(models) {console.log(this.options);
    if (this.options.migrations===false) {
      return Promise.resolve();      
    } else {
      return new Promise((resolve, reject) => {
        for (const key in models) {
          this.generateMigration(key, models)
        }
        resolve();
      });
    }
  }
  /**
   * Generate files to CRUD
   * @param {Object} schema
   */
  async generate(schema) {
    const name = schema.name;
    const fields = schema.fields;
    await this.makeModel(name, fields, schema);
    await this.makeController(name, fields);
    await this.makeRepository(name);
    await this.makeService(name);
    await this.makeView(name, fields);
    await this.makeTest(name, fields);
    //await this.makeCustom(schema);
  }

  async handle(args, options) {
    //apply options
    for (const flag in options) {
      if (options[flag] !== null) this.options[flag] = options[flag];
    }

    this.options = options;
    // Chose the source of scaffold
    let source = await this.choice("Source of scaffold", [
      "Database",
      "Json",
      "Yml"
    ]);

    let models = {};
    switch (source) {
      case "Database":
        {
          //ask for connection name
          const name = await this.ask("Enter connection name");

          let path = `database.${name}`;
          let configs = Config.get(path, false);
          if (configs == false) {
            console.log("Database config not found!");
            return;
          }

          let databaseService = {};
          switch (configs.client) {
            case "pg":
              {
                //generate scaffold from postgres database
                console.log("Database config founded! Client postgres");
                const PostgresService = require("../Services/PostgresService");
                databaseService = new PostgresService();
                databaseService.connect(name);
              }
              break;

            case "oracledb":
              {
                //generate scaffold from postgres database
                console.log("Database config founded! Client oracledb");
                const OracleService = require("../Services/OracleService");
                databaseService = new OracleService();
                databaseService.connect(name);
              }
              break;

            case "mysql":
              {
                //generate scaffold from postgres database
                console.log("Database config founded! Client mysql");
                const MySqlService = require("../Services/MySqlService");
                databaseService = new MySqlService();
                databaseService.connect(name);
              }
              break;

            default: {
              console.log("unsupported database client");
              return;
            }
          }

          let schemas = await databaseService.getSchemas();

          //let user choice which schema we will scaffold
          let schema = await this.choice("schema to scaffold", schemas);
          let tables = await databaseService.getTables(schema);
          let multiples = tables.map(function(value, index) {
            return value.name;
          });

          let selected = await this.multiple('Tables to scaffold', multiples, multiples);

          await databaseService.buildSchema(schema,tables.filter((value,index)=>{
            return selected.includes(value.name)
          }));
          databaseService.disconnect();

          models = await databaseService.buildModels();
          await this.exportModels(models);
          console.log("generating");
          await this.generateMigrations(models);
          // console.log(JSON.stringify(models));
          //for each table founded generate the
           for (const id in models) {
             await this.generate(models[id]);
          }
        }
        break;

      case "Json":
        {
          try {
            const name = await this.ask("Enter json name");
            let filename = path.join(this.helpers.appRoot(), name + ".json");

            await this._getContents(filename, async (error, contents) => {
              if (error) {
                console.log(error);
                return;
              }
              models = JSON.parse(contents);

              let multiples = [];
              for (const name in models) {
                multiples.push(name);
              }

              let selected = await this.multiple('Tables to scaffold',multiples,multiples);

              for (const id in models) {
                if(selected.includes(id)){
                  await this.generate(models[id]);
                }
                else delete models[id];
              }
              //console.log(JSON.stringify(models))
              await this.generateMigrations(models);
            });
          } catch (e) {
            this._error(e.message);
          }
        }
        break;

      case "Yml":
        {
          try {
            const name = await this.ask("Enter yml name");
            models = yaml.load(
              path.join(this.helpers.appRoot(), name + ".yml")
            );
            await this.exportModels(models);

            //console.log(JSON.stringify(models));
            this.generate(models);
          } catch (e) {
            this._error(e.message);
          }
        }
        break;
    }
    this.stack = [];
    this.success("Ready. Thank you for use adonisjs-scaffold");
  }
}

module.exports = ScaffoldGenerator;
