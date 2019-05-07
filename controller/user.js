const mysqlBaseModel = require('../models/db-mysql');
const USER_TABLE_NAME = 'note_user_info';

module.exports = {
    /**
    * 创建一个新用户.
    * @param {string} account - 账户.
    * @param {string} password - 密码.
    * @returns {promise} 
    */
    async createUser({ account, password }) {
        try {
            const createResult = await mysqlBaseModel.insert(USER_TABLE_NAME, {
                account,
                password
            });
            if (createResult) {
                return this.findUser(account);
            }
        } catch (error) {
            console.log('---------------创建用户失败----------------', error);
            return Promise.resolve([]);
        }
    },
    /**
    * 查询数据库内是否已存在该用户信息.
    * @param {string} account - 用户账户.
    * @returns {object} 用户信息
    */
    async findUser(account) {
        try {
            return mysqlBaseModel.findOne(USER_TABLE_NAME, `account='${account}'`);
        } catch (error) {
            console.log('---------------查找用户信息失败----------------', error);
            return Promise.resolve([]);
        }
    },
    /**
    * 通过sessionId验证用户是否已经注册过.
    * @param {string} sessionId - sessionId.
    * @returns {promise} 
    */
    verifyToken() { },
    updateUserInfo() { },
    getUserInfo() { }
}