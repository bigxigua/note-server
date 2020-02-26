const router = require('koa-router')();
const fnv = require('fnv-plus');
const userController = require('../controller/user');
const jwt = require('jsonwebtoken');
const { JWT_KEY, PASSWORD_FNV_SALT, cookieConfig } = require('../config/server-config');
const { serializReuslt } = require('../util/serializable');

/**
 * login 路由
 * 1. 检测用户是否已经注册过
 *    (1).如果已经注册则验证密码是否正确
 *    (2).如果没有注册创建一个新用户
 */
router.post('/api/login', async (ctx) => {
    // TODO signed cookie
    let { account, password } = ctx.request.body;
    let token = ctx.cookies.get('token');
    let uuid = '';
    let userLoginVersion = '';
    // 是否是使用帐号密码登陆
    const isActiveLogin = (account && password);
    // 优先使用用户名+密码进行登陆，若无则使用cookie-token方式
    // 用户名+密码登陆方式
    console.log('token', token);
    if (isActiveLogin) {
        uuid = fnv.hash(account, 64).str();
    } else {
        // token登陆
        if (token) {
            let verifyResult = {};
            try {
                verifyResult = await jwt.verify(token, JWT_KEY) || {};
                console.log('======>>', verifyResult);
            } catch (error) {
                console.log('[jwt验证失败]', error);
            }
            console.log('verifyResult', verifyResult);
            if (verifyResult.uuid) {
                uuid = verifyResult.uuid;
                userLoginVersion = verifyResult.userLoginVersion;
            }
        }
    }
    if (!uuid) {
        ctx.body = serializReuslt('USER_INVALIDATION_OF_IDENTITY');
        return;
    }
    let [error, user] = await userController.findUser(`uuid='${uuid}'`);
    // 系统错误
    if (error || !user || !Array.isArray(user)) {
        ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
        return;
    }
    // 用户信息不存在
    if (user.length === 0) {
        ctx.body = serializReuslt('USER_NOT_EXIST');
        return;
    }
    // 密码登陆时，密码不正确
    if (isActiveLogin && user[0].password !== fnv.hash(`${password}-${PASSWORD_FNV_SALT}`, 128).str()) {
        ctx.body = serializReuslt('USER_PASSWORD_ERROR');
        return;
    }
    // token登陆时，token是伪造
    if (userLoginVersion && userLoginVersion !== user[0].user_login_version) {
        ctx.body = serializReuslt('USER_INVALIDATION_OF_IDENTITY');
        return;
    }
    // 更新cookie
    token = jwt.sign({
        uuid,
        userLoginVersion: user[0].user_login_version,
        exp: Math.floor((new Date().getTime()) / 1000) + 60 * 60 * 24 * 30
    }, JWT_KEY);
    ctx.cookies.set('token', token, cookieConfig);
    const result = user[0];
    delete result.password;
    delete result.id;
    delete result.user_login_version;
    ctx.body = serializReuslt('SUCCESS', {
        ...user[0]
    });
});

/**
 * 退出登陆
 */
router.post('/api/login/out', async (ctx) => {
    const { uuid } = ctx.request.body;
    let [error, result] = await userController.updateUserInfo({
        user_login_version: Date.now()
    }, `uuid='${uuid}'`);
    console.log(error, result);
    if (!error && result.changedRows > 0) {
        ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
    } else {
        ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
    }
})

module.exports = router;
