'use strict'

const { Command } = require('@adonisjs/ace')
const PostgresService  = require('../Services/PostgresService')
const Config = use('Config')

class Scaffold extends Command {
  static get signature () {
    return `
    scaffold
    `
  }

  static get description () {
    return 'Tell something helpful about this command'
  }

  async handle (args, options) {

    //ask for connection name
    const name = await this
    .ask('Enter connection name')

    let path = `database.${name}`;
    console.log(path);
    let configs = Config.get(path,false)

    if (configs == false) {
      console.log('Database config not found!');
      return
    }

    let databaseService = {};
    switch (configs.client) {
      case 'pg':{
        //generate scaffold from postgres database
        console.log('Database config founded! Client postgres')
        databaseService = new PostgresService()
        databaseService.connect(name)
      } break;
    
      default:{ 
        console.log('unsupported database client');   
        return;
      }
    }
  
    let schemas = await databaseService.getSchemas()//await connection.distinct('schemaname').from('pg_catalog.pg_tables')

    console.debug('schemas founded')
    console.debug(schemas)
    //transform result to plain array of strings
       
    //let user choice which schema we will scaffold
    let schema = await this.choice('schema to scaffold',schemas);
    console.debug(`the selected schema was ${schema}`);
    //query tables 
    let tables = await databaseService.getTables(schema);
    
    //for each table query columns
    for (const table of tables) {
      table.columns = await databaseService.getColumns(table.name);
      
      if (table.hasindexes) {
        //query all index belongs to table
        table.constraints = await databaseService.getConstraints(table.name);
      }                               
      console.log(table)
    }
    databaseService.disconnect()
  }
}

module.exports = Scaffold
