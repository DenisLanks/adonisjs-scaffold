'use strict'
const DatabaseService = require('../Services/DatabaseService')
const Database = use('Database')

class PostgresService extends DatabaseService{

   
    async getSchemas(){
        console.info('loading schemas from database...');

        let schemas =  await this.connection.distinct('schemaname').from('pg_catalog.pg_tables')
        return schemas.map(function(value, index){
            return value.schemaname
            });
    }
 
    async getTables(schema){
        return await this.connection.select('tablename as name','hasindexes','hastriggers')
        .from('pg_catalog.pg_tables')
        .where('schemaname',schema );
    }
 
    async getColumns(table){
        return await Database.from('pg_attribute')
        .innerJoin('pg_type', 'pg_attribute.atttypid', 'pg_type.oid')
        .innerJoin('pg_class', 'pg_attribute.attrelid', 'pg_class.oid')
        .where('attnum', '>=',0)
        .where('pg_class.relname',table)
        .orderBy('pg_attribute.attnum', 'asc')
        .select('pg_attribute.attname as name', 'pg_type.typname as type',
         'pg_attribute.attlen as length', 'pg_attribute.attnotnull as notnull', 'pg_attribute.atthasdef as hasdefault')
    }
 
    async getConstraints(table){
        return await Database.from('pg_constraint')
        .innerJoin('pg_class as pc','pg_constraint.conrelid', 'pc.oid')
        .leftJoin('pg_class as foreign','pg_constraint.confrelid', 'foreign.oid')
        .where('pc.relname',table)
        .select('pg_constraint.conname','pg_constraint.contype as type',
        'pg_constraint.conkey as keys','pg_constraint.confkey as foreign_keys',
        'pg_constraint.confupdtype as update_type', 'pg_constraint.confdeltype as delete_type',
        'foreign.relname as foreign_table')
    }

    async toYmlSchema(tables){
        let schemas = [];
        //for each table query columns
        for (const table of tables) {
            let schema = {};
            schema.name = table.name;
            schema.fields = {};    
            schema.rules = {};
            schema.relation = {};
                
            table.columns = await databaseService.getColumns(table.name);
            for (const column in table.columns) {
                let field = {};

                schema.fields[column.name] = field;
            }
            if (table.hasindexes) {
              //query all index belongs to table
              table.constraints = await databaseService.getConstraints(table.name);
            }                               
            schemas.push(schema);
          }
        return Promise.reject('Not implemented.');
    }
}

module.exports = PostgresService