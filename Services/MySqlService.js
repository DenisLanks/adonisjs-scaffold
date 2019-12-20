'use strict'
const DatabaseService = require('./DatabaseService')
export default class MySqlService extends DatabaseService {

    async getSchemas() {
        console.info('loading schemas from database...');
        let schemas = await this.connection.select('SCHEMANAME').from('information_schema.SCHEMATA')
        return Promise.resolve(schemas.map(function (value, index) {
            return value.schemaname
        }));
    }

    async getTables(schema) {
        return await this.connection.select('TABLE_NAME as name', 'TABLE_TYPE as type', 'hastriggers')
            .from('information_schema.TABLES')
            .where('TABLE_SCHEMA', schema);
    }

    async getColumns(table) {
        return await this.connection.from('information_schema.COLUMNS')
            .where('TABLE_NAME', table)
            .orderBy('ORDINAL_POSITION', 'asc')
            .select('COLUMN_NAME as name', 'DATA_TYPE as type', 'IS_NULLABLE as nullable',
                'CHARACTER_MAXIMUM_LENGTH as length', 'NUMERIC_PRECISION as precision', 'NUMERIC_SCALE as scale', 'COLUMN_COMMENT as comment')
    }

    async getConstraints(table) {

        let constraints = await this.connection.from('information_schema.TABLE_CONSTRAINTS as tc')
            .leftJoin('information_schema.KEY_COLUMN_USAGE as kcu', ' tc.TABLE_NAME', 'kcu.TABLE_NAME')
            .where("tc.TABLE_NAME", table)
            .distinct('tc.CONSTRAINT_NAME as name', 'tc.CONSTRAINT_TYPE as type', 'kcu.REFERENCED_TABLE_NAME as foreign_table');


        for (let constraint of constraints) {

            constraint.keys = await this.getColumnsConstraints(constraint.name,table);

            switch (constraint.type) {
                case "CHECK": break;
                case "UNIQUE": break;
                case "PRIMARY KEY": {
                } break;
                case "FOREIGN KEY": {
                    constraint.foreign_keys = await this.getColumnsConstraints(constraint.related);
                } break;
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