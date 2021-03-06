const mysqlBaseModel = require('../models/db-mysql');

async function tryCatchWrapper(fn) {
  try {
    const data = await fn();
    return [null, data];
  } catch (error) {
    global.logger.error(`SQL_CONTROLLER-EXECUTE-ERROR: ${JSON.stringify(error)}`);
    return Promise.resolve([error, null]);
  }
}

function CreateMysqlModel(table) {
  return {
    execute(sql, params = {}) {
      global.logger.info(`SQL_CONTROLLER-EXECUTE: ${sql}`);
      return tryCatchWrapper(async () => { return mysqlBaseModel.execute(sql, params) })
    },
    find(sql) {
      global.logger.info(`SQL_CONTROLLER-${table}-FIND: ${sql}`);
      return tryCatchWrapper(async () => { return mysqlBaseModel.find(table, sql) });
    },
    create(payload) {
      global.logger.info(`SQL_CONTROLLER-${table}-CREATE: ${JSON.stringify(payload || {})}`);
      return tryCatchWrapper(async () => { return mysqlBaseModel.insert(table, payload) });
    },
    update(params, where) {
      global.logger.info(`SQL_CONTROLLER-${table}-UPDATE: [WHERE]-[${where}] [params]-[${JSON.stringify(params || {})}]`);
      return tryCatchWrapper(async () => { return mysqlBaseModel.update(table, params, where) });
    },
    delete(where) {
      global.logger.info(`SQL_CONTROLLER-${table}-DELETE: [WHERE]-[${where}]`);
      return tryCatchWrapper(async () => { return mysqlBaseModel.delete(table, where) });
    },
  }
}

module.exports = CreateMysqlModel;