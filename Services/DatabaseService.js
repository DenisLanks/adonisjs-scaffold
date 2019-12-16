'use strict'
const Database = use('Database')
const inflect = require('inflect')
class DatabaseService {

  connect(name) {
    this.connection = Database.connection(name)
    this.schema = {};
    this.models = {};
    this.stack = [];
  }

  disconnect() {
    this.connection.close()
  }

  async getSchemas() {
    return Promise.reject('Not implemented.');
  }

  async getTables(schema) {
    return Promise.reject('Not implemented.');

  }

  async getColumns(table) {
    return Promise.resolve([]);

  }

  async getConstraints(table) {
    return Promise.reject('Not implemented.');
  }

  getTypeValidation(type, nullable, length, precision, scale) {
    let validation = [];
    if (nullable === false || nullable ==='NO' || nullable==='N' ) validation.push("required");
    switch (type) {
      case "string": {
        validation.push(type);
        if (length > 0) {
          validation.push('' + length);
        }
      } break;
      case "float": {
        validation.push(type);
        validation.push('' + precision);
        validation.push('' + scale);
      } break;
      case "decimal": {
        validation.push(type);
        validation.push('' + precision);
        validation.push('' + scale);
      } break;
      default: {
        validation.push(type);
      } break;
    }
    return validation.join("|");
  }

  async buildModels() {
    console.log("Tryng build models. Await!");
    for (const name in this.models) {
      let model = this.models[name];
      if (model.builded===false) {
        this.models[name] = await this.buildModel(name);
      }
    }
    return Promise.resolve(this.models);
  }

  async buildModel(name) {
    //Get table structure
    let table = this.schema[name];
    let model = this.models[name];

    if (model.builded === true) return model;

    console.log(`building model ${name}`);
    this.stack.push(name);

    let modelName = inflect.singularize(name.toLowerCase());
    modelName = inflect.camelize(modelName);
    //build a field for each columns on table
    for (const column of table.columns) {
      let field = {};
      let type = this.getType(column.type);
      field.type = type;
      field.rules = this.getTypeValidation(type, column.nullable, column.length, column.precision, column.scale);
      model.fields[column.name] = field;
    }

    for (const i in table.constraints) {
      const constraint = table.constraints[i];
      switch (constraint.type) {
        case 'P':
        case 'p': {
          model.primary = constraint.keys;
        } break;
        case 'c':
          break;
        case 'R':
        case 'f': {
          let relation = {};
          relation.name = constraint.foreign_table;
          relation.relatedmodel = constraint.foreign_table;
          let relatedModel = inflect.singularize(constraint.foreign_table.toLowerCase());
          relatedModel = inflect.camelize(relatedModel);
          for (const key of constraint.keys) {
            let field = model.fields[key];
            if (field.type === 'biginteger' || field.type === 'integer') {
              field.unsigned = true;
            }
          }
          model.relation.push(
          {
            name: inflect.singularize(constraint.foreign_table),
            relationtype: "belongsTo",
            relatedmodel: relatedModel,
            relatedcolumn: constraint.foreign_keys,
            foreignkeys: constraint.keys,
          });

          if (name !== constraint.foreign_table && !this.stack.includes(constraint.foreign_table)) {
            let foreignModel = await this.buildModel(constraint.foreign_table);
            foreignModel.relation.push(
            {
              name: name,
              relationtype: "hasMany",
              relatedmodel: modelName,
              relatedcolumn: constraint.keys,
              foreignkeys: constraint.foreign_keys,
            });

          }else{
            model.relation.push(
            {
              name: name,
              relationtype: "hasMany",
              relatedmodel: modelName,
              relatedcolumn: constraint.keys,
              foreignkeys: constraint.foreign_keys,
            });
          }


        } break;
      }
      //console.log(value);
    }
    model.builded = true;
    this.stack.pop();
    return Promise.resolve(model);
  }


  async buildSchema(name) {
    console.log("Building schema from database. Await!");
    let tables = await this.getTables(name);
    for (const id in tables) {
      let table = tables[id];
      console.log(`Loading table ${table.name}`);
      table.columns = await this.getColumns(table.name);
      table.constraints = await this.getConstraints(table.name);
      this.schema[table.name] = table;
      this.models[table.name] = {
        name: table.name,
        fields: {},
        relation: [],
        primary: [],
        builded: false
      }
    }
    console.log("Schema built!");
  }
}
module.exports = DatabaseService
