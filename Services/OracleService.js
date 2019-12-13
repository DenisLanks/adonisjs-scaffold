'use strict'
const DatabaseService = require('./DatabaseService');
const Database = use('Database')
class OracleService extends DatabaseService
{

    async getSchemas(){
        return await this.connection.from('ALL_USERS')
        .orderBy('USERNAME', 'asc')
        .select('USERNAME as name');
    }

    async getTables(schema){
        //save to use another time
        this.schema = schema;
        return await this.connection.from('ALL_TABLES')
        .where('OWNER', '=',schema)
        .orderBy('TABLE_NAME', 'asc')
        .select('TABLE_NAME as name');
    }

    async getColumns(table){
        return await this.connection.from('ALL_TAB_COLS')
        .where('OWNER', '=',this.schema)
        .where('TABLE_NAME',table)
        .orderBy('COLUMN_ID', 'asc')
        .select('COLUMN_NAME as name', 'DATA_TYPE as type',
         'DATA_LENGTH as length', 'NULLABLE as nullable', 'DATA_PRECISION as precision','DATA_SCALE as scale')
    }

    async getConstraints(table){
      return await this.connection.from('ALL_CONSTRAINTS as ac')
      .innerJoin('ALL_CONS_COLUMNS as acc','ac.CONSTRAINT_NAME','acc.CONSTRAINT_NAME')
      .innerJoin('ALL_CONSTRAINTS as rc',' ac.R_CONSTRAINT_NAME','rc.CONSTRAINT_NAME')
      .innerJoin('ALL_CONS_COLUMNS as rcc', function () {
        this.on('rc.CONSTRAINT_NAME','rcc.CONSTRAINT_NAME')
        .andOn('rcc.POSITION','acc.POSITION');
      })
      .where("ac.CONSTRAINT_TYPE","R")
      .where("ac.TABLE_NAME", table)
      //.orderBy([{ column: 'ac.CONSTRAINT_NAME' }, { column: 'rcc.COLUMN_NAME'},
      //          { column:'acc.POSITION'},{ column: 'rcc.POSITION' }])
      .select('ac.CONSTRAINT_NAME', 'acc.COLUMN_NAME','rc.TABLE_NAME AS R_TABLE_NAME' ,'rcc.COLUMN_NAME AS R_COLUMN_NAME');
    }

    getType(dbtype){
      switch (dbtype) {
        case 'VARCHAR2': return 'string';
        case 'CHAR': return 'string';
        case 'NCHAR': return 'string';
        case 'NVARCHAR2 ': return 'string';
        case 'CLOB ': return 'text';
        case 'NLOB ': return 'text';
        case 'LONG ': return 'text';
        case 'NUMBER ': return 'decimal';
        case 'BINARY_FLOAT': return 'float';
        case 'BINARY_DOUBLE': return 'decimal';
        case 'DATE': return 'date';
        case 'DATETIME': return 'datetime';
        case 'TIMESTAMP': return 'timestamp';
        case 'BLOB': return 'binary';
        case 'BFILE': return 'binary';
        default:  return 'string';
      }
    }

    getTypeValidation(type, nullable, length, precision, scale){
        let validation = [];
        if(nullable==='N') validation.push("required");
        switch (type) {
          case "string":{
            validation.push(type);
            validation.push(''+length);
          }break;
          case "float": {
            validation.push(type);
            validation.push(''+precision);
            validation.push(''+scale);
          }break;
          case "decimal":{
            validation.push(type);
            validation.push(''+precision);
            validation.push(''+scale);
          }break;
          case "timestamp":break;

          default:{
            validation.push(type);
          }break;
        }
        return validation.join("|");
    }
    async toYmlSchema(schema){
        let schemas = [];
        let tables = await this.getTables(schema)
        //for each table query columns
        for (const table of tables) {
            let entity = {};
            entity.name = table.name;
            entity.fields = {};
            entity.relation = {};
            try {

              table.columns = await this.getColumns(table.name);
              //console.log(table.columns)
              for (const index in table.columns) {
                  let column = table.columns[index];
                  let field = {};
                  let type = this.getType(column.type);
                  field.type = type;
                  field.rules = this.getTypeValidation(type, column.nullable, column.length,column.precision, column.scale);
                  entity.fields[column.name] = field;
              }

              table.constraints = await this.getConstraints(table.name);
              console.log(table.constraints);
              schemas.push(entity);
            } catch (error) {
              //this.error(error)
              console.log(error);
            }

          }
        return Promise.resolve(schemas);
    }
}

module.exports = OracleService;
