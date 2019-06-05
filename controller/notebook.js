const mysqlBaseModel = require('../models/db-mysql');
const NOTEBOOK_TABLE_NAME = 'note_notebook';
const SUB_NOTEBOOK_TABLE_NAME = 'note_subnote';
module.exports = {
    /**
    * 创建一个新笔记.
    * @param {object} params - 账户.
    * @returns {} 
    */
    async createNotebook(params, tableName) {
        try {
            const result = await mysqlBaseModel.insert(tableName, params);
            console.log(result);
            return {
                ...params,
                subNotes: []
            };
        } catch (error) {
            console.log('---------------创建笔记本失败----------------', error);
            return null;
        }
    },
    /**
    * 创建一个子笔记.
    * @param {object} params - 账户.
    * @returns {} 
    */
    async createSubNotebook(params) {
        try {
            const result = await mysqlBaseModel.insert(SUB_NOTEBOOK_TABLE_NAME, params);
            console.log(result);
            return params;
        } catch (error) {
            console.log('---------------创建子笔记本失败----------------', error);
            return null;
        }
    },
    /**
    * 查询数据库内是否已存在该笔记.
    * @param {string} account - 用户账户.
    * @returns {object} 用户信息
    */
    async findNoteBooks(sql, tableName) {
        try {
            return mysqlBaseModel.find(tableName, sql);
        } catch (error) {
            console.log('---------------查找笔记失败----------------', error);
            return Promise.resolve([]);
        }
    },
    /**
    * 更新一个笔记本数据.
    * @param {string} params - 需要更新的数据.
    * @returns {object} 笔记数据
    */
    async updateNotebook(params, where, tableName) {
        try {
            return mysqlBaseModel.update(tableName, params, where);
        } catch (error) {
            console.log('---------------更新笔记失败----------------', error);
            return Promise.resolve([]);
        }
    },
    /**
    * 真实删除一个笔记.
    * @param {string} params.
    * @returns {object} 笔记数据
    */
    async deleteNotebook(where, tableName) {
        try {
            return mysqlBaseModel.delete(tableName, where);
        } catch (error) {
            console.log('---------------删除笔记失败----------------', error);
            return Promise.resolve([]);
        }
    },
}