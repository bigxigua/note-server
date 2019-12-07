const mysqlBaseModel = require('../models/db-mysql');

async function tryCatchWrapper(fn) {
  try {
    const data = await fn();
    return [null, data];
  } catch (error) {
    console.log('------出错啦------', error);
    return Promise.resolve([error, null]);
  }
}

function CreateMysqlModel(table) {
  return {
    mysqlBaseModel,
    find(sql) {
      return tryCatchWrapper(async () => { return mysqlBaseModel.find(table, sql) });
    },
    create(payload) {
      return tryCatchWrapper(async () => { return mysqlBaseModel.insert(table, payload) });
    },
    update(params, where) {
      return tryCatchWrapper(async () => { return mysqlBaseModel.update(table, params, where) });
    },
    delete(where) {
      return tryCatchWrapper(async () => { return mysqlBaseModel.delete(table, where) });
    },
  }
}

module.exports = CreateMysqlModel;