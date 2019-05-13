const mysqlBaseModel = require('../models/db-mysql');
const NOTEBOOK_TABLE_NAME = 'note_notebook';

const DEFAULT_NOTE_PARAMS = {
    notebook_name: '', // 笔记本名称
    user_id: '', // 用户的uuid
    sub_note_html: '', // 子笔记html文本
    sub_note_markdown: '', // 子笔记markdown文本
    sub_note_title: '', // 笔记标题
    sub_note_id: '', // 子笔记
    is_notebook: 0, // 是笔记本还是子笔记 1是0否
};
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
            return {
                ...notebookInfo,
                subNotes: [notebookInfo]
            };
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
    async findNoteBooks(sql) {
        try {
            return mysqlBaseModel.find(NOTEBOOK_TABLE_NAME, sql);
        } catch (error) {
            console.log('---------------查找用户信息失败----------------', error);
            return Promise.resolve([]);
        }
    },
    /**
    * 更新一个笔记本数据.
    * @param {string} params - 需要更新的数据.
    * @returns {object} 笔记数据
    */
    async updateNotebook(params, where) {
        try {
            return mysqlBaseModel.update(NOTEBOOK_TABLE_NAME, params, where);
        } catch (error) {
            console.log('---------------查找用户信息失败----------------', error);
            return Promise.resolve([]);
        }
    },
}