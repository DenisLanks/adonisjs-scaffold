'use strict'
const DatabaseService = require('./DatabaseService');
class OracleService extends DatabaseService {

  async getSchemas() {
    return await this.connection.from('ALL_USERS')
      .orderBy('USERNAME', 'asc')
      .select('USERNAME as name');
  }

  async getTables(schema) {
    return await this.connection.from('ALL_TABLES')
      .where('OWNER', '=', schema)
      .orderBy('TABLE_NAME', 'asc')
      .select('TABLE_NAME as name');
  }

  async getColumns(table) {
    return await this.connection.from('ALL_TAB_COLS')
      //  .where('OWNER', '=',this.schema)
      .where('TABLE_NAME', table)
      .orderBy('COLUMN_ID', 'asc')
      .select('COLUMN_NAME as name', 'DATA_TYPE as type', 'DATA_DEFAULT as default',
        'DATA_LENGTH as length', 'NULLABLE as nullable', 'DATA_PRECISION as precision', 'DATA_SCALE as scale')
  }

  async getColumnsConstraints(name) {
    return await this.connection.from('ALL_CONS_COLUMNS')
      .where('CONSTRAINT_NAME', name)
      .orderBy('POSITION', 'asc')
      .select('COLUMN_NAME as name')
      .map(function (value) {
        return value.name;
      });
  }

  async getConstraints(table) {

    let constraints = await this.connection.from('ALL_CONSTRAINTS as ac')
      .leftJoin('ALL_CONSTRAINTS as rc', ' ac.R_CONSTRAINT_NAME', 'rc.CONSTRAINT_NAME')
      .where("ac.TABLE_NAME", table)
      .select('ac.CONSTRAINT_NAME as name', 'ac.CONSTRAINT_TYPE as type', 'ac.R_CONSTRAINT_NAME as related', 'rc.TABLE_NAME as foreign_table');


    for (let constraint of constraints) {

      constraint.keys = await this.getColumnsConstraints(constraint.name);

      switch (constraint.type) {
        case "C":

          break;
        case "P": {
        } break;
        case "U": {

        } break;
        case "R": {
          constraint.foreign_keys = await this.getColumnsConstraints(constraint.related);
        } break;
      }

    }
    return Promise.resolve(constraints);
  }

  getType(dbtype, length, precision, scale) {
    let type = [];
    switch (dbtype) {
      case 'VARCHAR2': return 'string';
      case 'CHAR': return 'string';
      case 'NCHAR': return 'string';
      case 'NVARCHAR2': return 'string';
      case 'CLOB': return 'text';
      case 'NLOB': return 'text';
      case 'LONG': return 'text';
      case 'NUMBER': {
        if (scale === 0) {
          if (precision > 10) {
            type.push('integer');
          } else {
            type.push('biginteger')
          }
        } else {
          type.push('decimal');
          if (precision !== null) {
            type.push(precision);
          }

          if (scale !== null) {
            type.push(scale);
          }
        }
      } break;
      case 'BINARY_FLOAT': return 'float';
      case 'BINARY_DOUBLE': return 'decimal';
      case 'DATE': return 'date';
      case 'DATETIME': return 'datetime';
      case 'TIMESTAMP': return 'timestamp';
      case 'BLOB': return 'binary';
      case 'BFILE': return 'binary';
      default: {
        type.push('string');
        type.push(length);
      } break;
    }

    return type.join("|");
  }

  async getIndexes(table) {
    return new Promise(async (resolve, reject) => {
      try {
        let indices = [];
        let discard =['R','P'];
        //Get index from table
        let indexes = await this.connection.from('ALL_INDEXES as ai')
          .where('ai.TABLE_NAME', table)
          .where('ai.UNIQUENESS', 'NONUNIQUE')
          .select('ai.INDEX_NAME as name');

        //Discard primary and foreign index
        //get columns from indexes
        for (let index of indexes) {
          let cons = await this.connection.from('ALL_CONSTRAINTS as ac')
          .where("ac.INDEX_NAME", index.name)
          .select('ac.CONSTRAINT_TYPE as type');

          if (cons.length > 0 && discard.includes(cons[0])) {
              continue;
          }

          index.columns = await this.connection.from('ALL_IND_COLUMNS as aic2')
            .where('aic2.TABLE_NAME',table)
            .where('aic2.INDEX_NAME',index.name)
            .orderBy('aic2.COLUMN_POSITION', 'asc')
            .select('aic2.COLUMN_NAME as name')
            .map(function (value) {
              return value.name;
            })
            ;
          indices.push(index);
        }

        indexes = null;
        resolve(indices);
      } catch (error) {
        reject(error);
      }
    });
  }

}

module.exports = OracleService;
