'use strict'
const Database = use('Database')

class DatabaseService{

    connect(name){
        this.connection = Database.connection(name)
    }

    disconnect(){
        this.connection.close()
    }

    async getSchemas(){
    return Promise.reject('Not implemented.');
    }

    async getTables(schema){
    return Promise.reject('Not implemented.');

    }

    async getColumns(table){
        return Promise.resolve([]);

    }

    async getConstraints(table){
        return Promise.reject('Not implemented.');
    }

    async toYmlSchema(){
        return Promise.reject('Not implemented.');
    }
}
module.exports = DatabaseService