const router = require('koa-router')();
const fnv = require('fnv-plus');
const userController = require('../controller/user');
const jwt = require('jsonwebtoken');
const { JWT_KEY, cookieConfig } = require('../config/server-config');
const { serializReuslt } = require('../util/serializable');
/**
 * login 路由
 * 1. 检测用户是否已经注册过
 *    (1).如果已经注册则验证密码是否正确
 *    (2).如果没有注册创建一个新用户
 */
router.post('/login', async (ctx, next) => {
    // TODO signed cookie
    let { account, password } = ctx.request.body;
    let token = ctx.cookies.get('token');
    if (!token && !account && !password) {
        ctx.body = serializReuslt('USER_NOT_LOGGED_IN');
        return;
    }
    if (token && !account && !password) {
        let verifyResult = jwt.verify(token, JWT_KEY) || {};
        if (verifyResult.account) {
            account = verifyResult.account;
        }
    }
    let user = await userController.findUser(account);
    if (!user || user.length === 0) {
        user = await userController.createUser({
            account,
            password,
            uuid: fnv.hash(account, 64)
        });
        console.log('------------创建新用户成功------------', user[0]);
    } else {
        console.log('------------用户已存在------------', user[0]);
    }
    if (user && user.length > 0) {
        token = jwt.sign({
            account,
            exp: Math.floor((new Date().getTime()) / 1000) + 60 * 60 * 24 * 30
        }, JWT_KEY);
        ctx.cookies.set('token', token, cookieConfig);
        ctx.body = serializReuslt('SUCCESS', user[0]);
    } else {
        ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
    }
});

module.exports = router;
