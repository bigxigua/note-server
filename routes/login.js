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
    let uuid = '';
    let userLoginVersion = '';
    // 自动登陆无token时
    if (!token && !account && !password) {
        ctx.body = serializReuslt('USER_NOT_LOGGED_IN');
        return;
    }
    // 自动登陆有token时
    if (token && !account && !password) {
        let verifyResult = await jwt.verify(token, JWT_KEY) || {};
        if (verifyResult.uuid) {
            uuid = verifyResult.uuid;
            userLoginVersion = verifyResult.userLoginVersion;
        }
    } else {
        uuid = fnv.hash(account, 64).str();
    }
    if (!uuid) {
        ctx.body = serializReuslt('USER_NOT_LOGGED_IN');
        return;
    }
    let user = await userController.findUser(`uuid='${uuid}'`);
    // 比较jwt获取到的userLoginVersion和用户表里的是否一致，如果不一致则token无效
    if (!user || user.length === 0) {
        user = await userController.createUser({
            account,
            password,
            uuid,
            user_login_version: Date.now() + ''
        });
    }
    if (user && user.length > 0) {
        if (password && user[0].password !== password) {
            ctx.body = serializReuslt('USER_LOGIN_ERROR');
            return;
        }
        if (userLoginVersion && userLoginVersion !== user[0].user_login_version) {
            ctx.body = serializReuslt('USER_INVALIDATION_OF_IDENTITY');
            return;
        }
        token = jwt.sign({
            uuid,
            userLoginVersion: user[0].user_login_version,
            exp: Math.floor((new Date().getTime()) / 1000) + 60 * 60 * 24 * 30
        }, JWT_KEY);
        ctx.cookies.set('token', token, cookieConfig);
        ctx.body = serializReuslt('SUCCESS', user[0]);
    } else {
        ctx.body = serializReuslt('USER_NOT_EXIST');
    }
});
/**
 * 退出登陆
 */
router.post('/outLogin', async (ctx, next) => {
    const { uuid } = ctx.request.body;
    let user = await userController.findUser(`uuid='${uuid}'`);
    if (user && user.length > 0) {
        let result = await userController.updateUserInfo({
            user_login_version: Date.now()
        }, `uuid='${uuid}'`);
        if (result && result.changedRows > 0) {
            ctx.body = serializReuslt('SUCCESS', {});
        } else {
            ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
        }
    } else {
        ctx.body = serializReuslt('USER_NOT_EXIST');
    }
})

module.exports = router;
