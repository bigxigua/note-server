const mysqlBaseModel = require('../models/db-mysql');
const TABLE_NAME = 'space';

module.exports = {
	/**
	* 查询空间列表
	*/
  async findSpace(sql) {
    try {
      const data = await mysqlBaseModel.find(TABLE_NAME, sql);
      return [null, data];
    } catch (error) {
      console.log('---------------查询空间失败----------------', error);
      return Promise.resolve([error, null]);
    }
  },
  /**
  * 创建一个新空间.
  */
  async createSpace(payload) {
    try {
      const result = await mysqlBaseModel.insert(TABLE_NAME, payload);
      return [null, result]
    } catch (error) {
      console.log('---------------创建空间失败----------------', error);
      return [error, null];
    }
  },
}