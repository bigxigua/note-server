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
router.post('/api/register', async (ctx, next) => {
    let { account, password } = ctx.request.body;
    if (!account || !password) {
        ctx.body = serializReuslt('PARAM_NOT_COMPLETE');
        return;
    }
    const uuid = fnv.hash(account, 64).str();
    let [error, user] = await userController.findUser(`uuid='${uuid}'`);
    if (error || !user || !Array.isArray(user)) {
        ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
        return;
    }
    const now = Date.now();
    if (user.length === 0) {
        user = await userController.createUser({
            account,
            name: account,
            password: fnv.hash(`${password}-${PASSWORD_FNV_SALT}`, 128).str(),
            uuid,
            user_login_version: Date.now() + '',
            created_at: new Date(now),
            created_at_timestamp: now
        });
        if (user.length === 0) {
            ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
            return;
        }
        token = jwt.sign({
            uuid,
            userLoginVersion: user[0].user_login_version,
        }, JWT_KEY, {
            expiresIn: '30d'
        });
        ctx.cookies.set('token', token, cookieConfig);
        ctx.body = serializReuslt('SUCCESS', {
            ...user[0],
        });
    } else {
        ctx.body = serializReuslt('USER_HAS_EXISTED');
    }
});

module.exports = router;
