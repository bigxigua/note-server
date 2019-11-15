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
}