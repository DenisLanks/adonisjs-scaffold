'use strict'
import DatabaseService from './DatabaseService';
const Database = use('Database')
class OracleService extends DatabaseService
{
    connect(name){
        this.connection = Database.connection(name)
    }

    disconnect(){
        this.connection.close()
    }

    async getSchemas(){
        return await Database.from('all_users')
        .orderBy('username', 'asc')
        .select('username as name');
    }

    async getTables(schema){
        //save to use another time
        this.schema = schema;
        return await Database.from('all_tables')
        .where('owner', '=',schema)
        .orderBy('table_name', 'asc')
        .select('table_name as name');
    }

    async getColumns(table){
        return await Database.from('all_tab_cols')
        .where('owner', '=',this.schema)
        .where('table_name',table)
        .orderBy('column_id', 'asc')
        .select('column_name as name', 'data_type as type',
         'data_length as length', 'pg_attribute.attnotnull as notnull', 'pg_attribute.atthasdef as hasdefault','data_precision as precision','data_scale as scale')
    }

    async getConstraints(table){
        return Promise.reject('Not implemented.');
    }

    async toYmlSchema(){
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

module.exports = OracleService;
