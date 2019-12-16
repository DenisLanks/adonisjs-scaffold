'use strict'
const DatabaseService = require('../Services/DatabaseService')

class PostgresService extends DatabaseService {


    async getSchemas() {
        console.info('loading schemas from database...');
        let schemas = await this.connection.distinct('schemaname').from('pg_catalog.pg_tables')
        return schemas.map(function (value, index) {
            return value.schemaname
        });
    }

    async getTables(schema) {
        return await this.connection.select('tablename as name', 'hasindexes', 'hastriggers')
            .from('pg_catalog.pg_tables')
            .where('schemaname', schema);
    }

    async getColumns(table) {
        return await this.connection.from('information_schema.columns')
            .where('table_name', table)
            .orderBy('ordinal_position', 'asc')
            .select('column_name as name','udt_name as type', 'is_nullable as nullable',
                'character_maximum_length as length', 'numeric_precision as precision', 'numeric_scale as scale')
    }

    async getConstraints(table) {
        let constraints = await this.connection.from('pg_constraint')
        .innerJoin('pg_class as pc', 'pg_constraint.conrelid', 'pc.oid')
        .leftJoin('pg_class as foreign', 'pg_constraint.confrelid', 'foreign.oid')
        .where('pc.relname', table)
        .select('pg_constraint.conname as name', 'pg_constraint.contype as type',
            'pg_constraint.conkey as keys', 'pg_constraint.confkey as foreign_keys',
            'pg_constraint.confupdtype as update_type', 'pg_constraint.confdeltype as delete_type',
            'foreign.relname as foreign_table');

        for (const constraint of constraints) {
            constraint.keys = await this.connection.from('information_schema.columns')
            .where('table_name', table)
            .whereIn('ordinal_position', constraint.keys)
            .orderBy('ordinal_position', 'asc')
            .select('column_name as name' )
            .map(function (value) {
                return value.name;
            });

            if (constraint.foreign_table) {
                
                constraint.foreign_keys = await this.connection.from('information_schema.columns')
                .where('table_name', constraint.foreign_table)
                .whereIn('ordinal_position', constraint.foreign_keys)
                .orderBy('ordinal_position', 'asc')
                .select('column_name as name' )
                .map(function (value) {
                    return value.name;
                });
            }
        }    
        return constraints;
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
    
    async toYmlSchema(schema) {
        let schemas = [];
        //for each table query columns
        for (const table_name in this.schema) {
            let table = this.schema[table_name]
            let entity = {};
            entity.name = table_name;
            entity.fields = {};
            entity.relation = {};
            entity.primary = [];

            for (const index in table.columns) {
                let column = table.columns[index];
                let nullable = !column.notnull;
                let field = {};
                let type = this.getType(column.type);
                field.type = type;
                field.rules = this.getTypeValidation(type, nullable, column.length, column.precision, column.scale);
                entity.fields[column.name] = field;
            }

            for (const key in table.constraints) {
                const value = table.constraints[key];
                switch (value.type) {
                    case 'p':{
                        console.log(`${table_name} primary key:`);
                        for (const i in value.keys) {
                            const id = value.keys[i] -1;
                            const column = table.columns[id];
                            entity.primary.push(column.name);
                        }
                        
                    }break;
                    case 'c':                  
                        break;
                    case 'f':{
                        let relation = {};
                        relation.name = value.foreign_table;
                        relation.relatedmodel = value.foreign_table;
                        for (const i in value.keys) {
                            const id = value.keys[i] -1;
                            const column = table.columns[id];
                            entity.primary.push(column.name);
                            let field = entity.fields[column.name];
                            if (field.type ==='biginteger' || field.type ==='integer') {
                                field.unsigned = true;
                            }
                            //console.log(entity.fields[column.name])
                        }

                        let foreign_table = this.schema[value.foreign_table];
                    }break;
                }
                //console.log(value);
            }
            //console.log(JSON.stringify(table.constraints));
            console.log(entity);
            schemas.push(entity);
        }
        //console.log(JSON.stringify(schemas));
        return Promise.resolve(schemas);
    }
}

module.exports = PostgresService
