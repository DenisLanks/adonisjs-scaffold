'use strict'

const path = require('path')
const nunjucks = require('nunjucks')
const ejs = require('ejs')
const i = require('inflect')
const Ioc = require('@adonisjs/fold').ioc
const { Command } = require('@adonisjs/ace')
const Config = Ioc.use('Config')
const fs = require('co-fs-extra')
const env = new nunjucks.Environment()

env.addFilter('split', function (str, seperator) {
  return str.split(seperator)
});

env.addFilter('primaryIndex', function (keys) {
  return `table.primary(${keys.reduce(
    function (total, value,index) {
      if (index !== 0) {
        return total + `,"${value}"`;
      }
      return total + `"${value}"`;
    }
    , '')});`;
});

env.addFilter('index', function (index){
if(index ===undefined)
	return '';

//	console.log(`indices: ${JSON.stringify(index)}`);
  return `table.index([${index.columns.reduce(
    function (total, value,i) {
      if (i !== 0) {
        return total + `,"${value}"`;
      }
      return total + `"${value}"`;
    }
    , '')}],"${index.name}");`;
});

env.addFilter('fields', function (name, field) {
  let path = ['table'];
  let tokens = field.type.split('|');
  if (tokens.length > 1) {
    let args = tokens.reduce(function (total, value, index, arr) {
      if (index !== 0) {
        return total + `,${value}`;
      }
      return total;
    }, '');

    path.push(`${tokens[0]}("${name}"${args})`);
  } else {
    path.push(`${field.type}("${name}")`);
  }

  if (field.nullable ===true) {
    path.push('nullable()');
  }

  if (field.unsigned) {
    path.push('unsigned()');
  }

  if (field.unique) {
    path.push('unique()');
  }

  return path.join(".");
});

class Base extends Command {
  constructor(Helpers) {
    super();
    this.helpers = Helpers;
    this.config = Config.get('scaffold', {
      templates: './../templates',
      customTemplates: null,
      services: true,
      repositories: true,
      migrations: true,
      stack: 'fullstack', //fullstack, backend,
      mode: 'interactive' //interactive, silent
    });

    this.options = {
      exportModels: false,
      log: false,
    };
  }

  /**
   * makes path to a given template
   * @param  {String} template
   * @return {String}
   *
   * @private
   */
  _makeTemplatePath(template, ext) {
    return path.join(__dirname, this.config.templates, `${template}${ext}`)
  }

  /**
   * makes entity name to be used as the file name
   * @param  {String} name
   * @param  {String} entity
   * @param  {Boolean} needPrefix
   * @param  {String} [noun]
   * @return {String}
   *
   * @private
   */
  _makeEntityName(name, entity, needPrefix, noun) {
    name = name.split(path.sep)
    let baseName = name.pop()
    const method = `${noun}ize`
    const regExp = new RegExp(`-?_?${entity}`, 'g')
    baseName = i.underscore(baseName).replace(regExp, '')
    baseName = i[method] ? i[method](baseName) : baseName
    const entityName = needPrefix ? i.camelize(`${baseName}_${entity}`) : i.camelize(baseName)
    name.push(entityName)
    return { entityPath: name.join(path.sep), entityName }
  }

  /**
   * returns contents for a given template
   * @param  {String} template
   * @return {String}
   *
   * @private
   */
  async _getContents(template, callback) {
    return new Promise(async (resolve,reject)=>{
      await fs.readFile(template, 'utf-8', callback);
      resolve();
    });
  }

  /**
   * tells whether a template exists or not
   * @param  {String}  dest
   * @return {Boolean}
   *
   * @private
   */
  async _hasFile(dest) {
    return Promise.resolve(fs.exists(dest));
  }

  /**
   * writes contents to a given destination
   * @param  {String} dest
   * @param  {String} contents
   * @return {String}
   *
   * @private
   */
  async _writeContents(dest, contents) {
    return new Promise(() => {
      fs.outputFile(dest, contents, (error) => { });
      //console.log(`create: ${dest}`);
    }, (error) => {
      console.log(error);
    });
  }

  /**
   * writes template contents to a given destination.
   *
   * @param  {String} template
   * @param  {String} dest
   * @param  {Object} options
   * @return {String}
   *
   * @public
   */

  async write(template, dest, options, renderingTemplate) {
    template = template.endsWith(renderingTemplate) ? template : this._makeTemplatePath(template, renderingTemplate);
    await this._getContents(template, async (err, contents) => {
      if (err) {
        console.error(err);
        return Promise.resolve();
      }
      // const hasFile = await this._hasFile(dest)
      // if (hasFile) {
      //   throw new Error(`I am afraid ${this._incrementalPath(dest)} already exists`)
      // }

      if (renderingTemplate === '.njk') {
        const temp = nunjucks.compile(contents, env)
        return await this._writeContents(dest, temp.render(options))
      } else {
        const temp = ejs.compile(contents)
        return await this._writeContents(dest, temp(options))
      }

    });
  }

  /**
   * returns incremental path for a given absolute path
   *
   * @param  {String} toPath
   * @return {String}
   *
   * @private
   */
  _incrementalPath(toPath) {
    const regeExp = new RegExp(`${this.helpers.appRoot()}${path.sep}?`)
    return toPath.replace(regeExp, '')
  }

  /**
   * logs the completed message on the console by
   * making incrementalPath path
   *
   * @param  {String} toPath
   *
   * @private
   */
  _success(toPath) {
    const incrementalPath = this._incrementalPath(toPath)
    this.completed('create', incrementalPath)
  }

  /**
   * logs error to the console
   *
   * @param  {String} error
   *
   * @private
   */
  _error(error) {
    this.error(error)
  }

  /**
   * writes file to a given destination and automatically logs
   * errors and success messages to the terminal.
   *
   * @param  {String} entity
   * @param  {String} dest
   * @param  {Object} options
   *
   * @private
   */
  async _wrapWrite(entity, dest, options, renderingTemplate) {
    await this.write(entity, dest, options, renderingTemplate);
  }
}

module.exports = Base
