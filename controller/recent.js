const mysqlBaseModel = require('../models/db-mysql');
const TABLE_NAME = 'recent';

module.exports = {
	/**
	* 查询最近使用列表
	*/
	async findRecent(sql) {
		try {
			const data = await mysqlBaseModel.find(TABLE_NAME, sql);
			return [null, data];
		} catch (error) {
			console.log('---------------查询最近列表失败----------------', error);
			return Promise.resolve([error, null]);
		}
	},
	/**
* 创建一个新文档.
*/
	async createRecent(payload) {
		try {
			const result = await mysqlBaseModel.insert(TABLE_NAME, payload);
			return [null, result]
		} catch (error) {
			console.log('---------------创建最近列表失败----------------', error);
			return [error, null];
		}
	},
	/**
* 更新一个文档.
*/
	async updateRecent(params, where) {
		try {
			const result = await mysqlBaseModel.update(TABLE_NAME, params, where);
			return [null, result]
		} catch (error) {
			console.log('---------------更新最近列表失败----------------', error);
			return [error, null];
		}
	},
	/**
* 真实删除一个最近使用记录.
* @param {string} params.
* @returns {object} 笔记数据
*/
	async deleteRecent(where) {
		try {
			const result = await mysqlBaseModel.delete(TABLE_NAME, where);
			return [null, result]
		} catch (error) {
			console.log('---------------删除最近使用记录失败----------------', error);
			return [error, null];
		}
	},
}