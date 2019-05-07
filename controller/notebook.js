const mysqlBaseModel = require('../models/db-mysql');
const NOTEBOOK_TABLE_NAME = 'note_notebook';

const DEFAULT_NOTE_PARAMS = {
    notebook_name: '', // 笔记本名称
    user_id: '', // 用户的uuid
    html: '', // 笔记html文本
    markdown: '', // 笔记markdown文本
    title: '' // 笔记标题
}
module.exports = {
    /**
    * 创建一个新笔记.
    * @param {object} params - 账户.
    * @returns {} 
    */
    async createNotebook(params) {
        const notebookInfo = {
            ...DEFAULT_NOTE_PARAMS,
            ...params
        };
        try {
            await mysqlBaseModel.insert(NOTEBOOK_TABLE_NAME, notebookInfo);
            return notebookInfo;
        } catch (error) {
            console.log('---------------创建笔记本失败----------------', error);
            return null;
        }
    },
    /**
    * 查询数据库内是否已存在该笔记.
    * @param {string} account - 用户账户.
    * @returns {object} 用户信息
    */
    async findUser(account) {
        // try {
        //     return mysqlBaseModel.findOne(NOTEBOOK_TABLE_NAME, `account='${account}'`);
        // } catch (error) {
        //     console.log('---------------查找用户信息失败----------------', error);
        //     return Promise.resolve([]);
        // }
    }
}