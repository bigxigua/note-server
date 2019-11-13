const mysqlBaseModel = require('../models/db-mysql');
const USER_TABLE_NAME = 'note_user_info';
const DEFAULT_USERINFO_PARAMS = {
    account: '', // 账户
    nickname: '', // 昵称
    password: '', // 密码
    uuid: '', // uuid
    avatar_url: '', // 头像
    created_at: '', // 账户创建时间
    description: '', // 用户描述
    type: 'User', // 用户类型 User普通用户 Admin管理员
}
module.exports = {
    /**
    * 创建一个新用户.
    * @param {object} params - 用户数据.
    * @returns {promise} 
    */
    async createUser(params) {
        const options = {
            ...DEFAULT_USERINFO_PARAMS,
            ...params
        };
        try {
            const createResult = await mysqlBaseModel.insert(USER_TABLE_NAME, options);
            if (createResult) {
                return Promise.resolve([options]);
            }
        } catch (error) {
            console.log('---------------创建用户失败----------------', error);
            return Promise.resolve([]);
        }
    },
    /**
    * 查询数据库内是否已存在该用户信息.
    * @param {string} whereSql - where条件语句
    * @returns {object} 用户信息
    */
    async findUser(whereSql) {
        try {
            return mysqlBaseModel.find(USER_TABLE_NAME, whereSql);
        } catch (error) {
            console.log('---------------查找用户信息失败----------------', error);
            return Promise.resolve([]);
        }
    },
    /**
    * 更新用户信息.
    * @param {object} params - 用户表中字段key，value.
    * @returns {promise} 
    */
    async updateUserInfo(params, where) {
        try {
            return mysqlBaseModel.update(USER_TABLE_NAME, params, where);
        } catch (error) {
            console.log('---------------更新笔记失败----------------', error);
            return Promise.resolve([]);
        }
       
    }
}