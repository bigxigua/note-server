const mysqlBaseModel = require('../models/db-mysql');
const TABLE_NAME = 'doc';

module.exports = {
	/**
	* 查询文档列表
	*/
	async findDocs(sql) {
		try {
			const data = await mysqlBaseModel.find(TABLE_NAME, sql);
			return [null, data];
		} catch (error) {
			console.log('---------------查询文档列表失败----------------', error);
			return Promise.resolve([error, null]);
		}
	},
	/**
* 创建一个新文档.
*/
	async createDoc(payload) {
		try {
			const result = await mysqlBaseModel.insert(TABLE_NAME, payload);
			return [null, result]
		} catch (error) {
			console.log('---------------创建文档失败----------------', error);
			return [error, null];
		}
	},
	/**
* 更新一个文档.
*/
	async updateDoc(params, where) {
		try {
			const result = await mysqlBaseModel.update(TABLE_NAME, params, where);
			return [null, result]
		} catch (error) {
			console.log('---------------更新文档失败----------------', error);
			return [error, null];
		}
	},
	/**
* 真实删除一个笔记.
* @param {string} params.
* @returns {object} 笔记数据
*/
	async deleteDoc(where) {
		try {
			const result = await mysqlBaseModel.delete(TABLE_NAME, where);
			return [null, result]
		} catch (error) {
			console.log('---------------删除文档失败----------------', error);
			return [error, null];
		}
	},
}