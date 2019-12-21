'use strict'
const DatabaseService = require('./DatabaseService')

class SqliteService extends DatabaseService{
    async getSchemas() {
        return Promise.reject('Not implemented.');
    }
    
    async getTables(schema) {
        //select * from sqlite_master;
        return Promise.reject('Not implemented.');

    }
    
    async getColumns(table) {
        //PRAGMA schema.table_info(table-name);
        return Promise.resolve([]);

    }
    
    async getConstraints(table) {
        // PRAGMA schema.index_list(table-name);
        // PRAGMA schema.index_info(index-name);
        return Promise.reject('Not implemented.');
    }
}

module.exports = SqliteService;

