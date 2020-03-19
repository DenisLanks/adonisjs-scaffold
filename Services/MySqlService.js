'use strict'
const DatabaseService = require('./DatabaseService')
class MySqlService extends DatabaseService {

    async getSchemas() {
        console.info('loading schemas from database...');
        let schemas = await this.connection.select('SCHEMA_NAME as schemaname').from('information_schema.SCHEMATA')
        return Promise.resolve(schemas.map(function (value, index) {
            return value.schemaname
        }));
    }

    async getTables(schema) {
        this.schemaName = schema;
        return await this.connection.select('TABLE_NAME as name', 'TABLE_TYPE as type', 'TABLE_COMMENT as comment')
            .from('information_schema.TABLES')
            .where('TABLE_SCHEMA', schema);
    }

    async getColumns(table) {
        return await this.connection.from('information_schema.COLUMNS')
            .where('TABLE_NAME', table)
            .where('TABLE_SCHEMA', this.schemaName)
            .orderBy('ORDINAL_POSITION', 'asc')
            .select('COLUMN_NAME as name', 'DATA_TYPE as type', 'IS_NULLABLE as nullable',
                'CHARACTER_MAXIMUM_LENGTH as length', 'NUMERIC_PRECISION as precision', 'NUMERIC_SCALE as scale', 'COLUMN_COMMENT as comment')
    }

    async getColumnsConstraints(name, table){
        return await this.connection.from('information_schema.KEY_COLUMN_USAGE as kcu')
            .where("kcu.TABLE_NAME", table)
            .where("kcu.CONSTRAINT_NAME", name)
            .where("kcu.TABLE_SCHEMA", this.schemaName)
            .orderBy('ORDINAL_POSITION','asc')
            .select('kcu.COLUMN_NAME as name','kcu.REFERENCED_COLUMN_NAME as reference');
    }

    async getConstraints(table) {

        //Get constraint's names 
        let constraints = await this.connection.from('information_schema.TABLE_CONSTRAINTS as tc')
            .leftJoin('information_schema.REFERENTIAL_CONSTRAINTS as rc', function() {
                this.on('tc.TABLE_NAME', '=', 'rc.TABLE_NAME')
                .on('tc.CONSTRAINT_NAME', '=', 'rc.CONSTRAINT_NAME')
              })
            .where("tc.TABLE_SCHEMA", this.schemaName)
            .where("tc.TABLE_NAME", table)
            .distinct('tc.CONSTRAINT_NAME as name', 'tc.CONSTRAINT_TYPE as type','rc.REFERENCED_TABLE_NAME as foreign_table');

        //for each constraint get columns informations
        for (let constraint of constraints) {
            
            let columns = await this.getColumnsConstraints(constraint.name,table);
            constraint.foreign_keys =[]; 
            constraint.keys =[]; 
            
            for (const column of columns) {
                constraint.keys.push(column.name);
                
                if (constraint.type === "FOREIGN KEY") {
                    constraint.keys.push(column.reference);
                }
                
            }
            

        }
        return Promise.resolve(constraints);
    }

    getType(dbtype) {
        switch (dbtype) {
            case 'timestamp': return dbtype;
            case 'text': return dbtype;
            case 'date': return dbtype;
            case 'datetime': return dbtype;
            case 'int8': return 'biginteger';
            case 'int4': return 'integer';
            case 'float8': return 'double';
            case 'float4': return 'float';
            case 'numeric': return 'decimal';

            default: {
                return 'string';
            }
        }
    }
}

module.exports = MySqlService;
