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
        return await this.connection.from('ALL_TABLES')
        .where('OWNER', '=',schema)
        .orderBy('TABLE_NAME', 'asc')
        .select('TABLE_NAME as name');
    }

    async getColumns(table){
        return await this.connection.from('ALL_TAB_COLS')
      //  .where('OWNER', '=',this.schema)
        .where('TABLE_NAME',table)
        .orderBy('COLUMN_ID', 'asc')
        .select('COLUMN_NAME as name', 'DATA_TYPE as type',
         'DATA_LENGTH as length', 'NULLABLE as nullable', 'DATA_PRECISION as precision','DATA_SCALE as scale')
    }

    async getColumnsConstraints(name){
       return await this.connection.from('ALL_CONS_COLUMNS')
       .where('CONSTRAINT_NAME', name)
       .orderBy('POSITION','asc')
       .select('COLUMN_NAME as name')
       .map(function (value) {
           return value.name;
       });
    }
    async getConstraints(table){

      let constraints = await this.connection.from('ALL_CONSTRAINTS as ac')
      .leftJoin('ALL_CONSTRAINTS as rc',' ac.R_CONSTRAINT_NAME','rc.CONSTRAINT_NAME')
      .where("ac.TABLE_NAME", table)
      .select('ac.CONSTRAINT_NAME as name', 'ac.CONSTRAINT_TYPE as type','ac.R_CONSTRAINT_NAME as related','rc.TABLE_NAME as foreign_table');


      for (let constraint of constraints) {

        constraint.keys = await this.getColumnsConstraints(constraint.name);

        switch (constraint.type) {
          case "C":

            break;
          case "P":{
          }break;
          case "R":{
            constraint.foreign_keys = await this.getColumnsConstraints(constraint.related);
          }break;
        }

      }
      return Promise.resolve(constraints);
    }

    getType(dbtype){
      switch (dbtype) {
        case 'VARCHAR2': return 'string';
        case 'CHAR': return 'string';
        case 'NCHAR': return 'string';
        case 'NVARCHAR2': return 'string';
        case 'CLOB': return 'text';
        case 'NLOB': return 'text';
        case 'LONG': return 'text';
        case 'NUMBER': return 'decimal';
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
}

module.exports = OracleService;
