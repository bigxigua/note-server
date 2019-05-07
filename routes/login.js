const router = require('koa-router')();
const userController = require('../controller/user');
const jwt = require('jsonwebtoken');
const { JWT_KEY, cookieConfig } = require('../config/server-config');
/**
 * login 路由
 * 1. 检测用户是否已经注册过
 *    (1).如果已经注册则验证密码是否正确
 *    (2).如果没有注册创建一个新用户
 */
router.post('/login', async (ctx, next) => {
    // TODO signed cookie
    let { account, password } = ctx.request.body;
    let token = ctx.cookies.get('token66');
    console.log('--------------token------------------', token);
    if (token && !account && !password) {
        let verifyResult = jwt.verify(token, JWT_KEY);
        console.log('--------------verifyResult------------------', verifyResult);
    }
    let user = await userController.findUser(account);
    if (!user || user.length === 0) {
        user = await userController.createUser({ account, password });
        console.log('------------创建新用户成功------------', user[0]);
    } else {
        console.log('------------用户已存在------------', user[0]);
    }
    ctx.cookies.set('token', 'tokentokentoken', cookieConfig);
    if (user && user.length > 0) {
        token = jwt.sign({
            account,
            exp: Math.floor((new Date().getTime()) / 1000) + 60 * 60 * 24 * 30
        }, JWT_KEY);
        ctx.cookies.set('token', token, cookieConfig);
        ctx.cookies.set('token111', 'token', {});
        ctx.body = {
            userInfo: user[0],
            token
        }
    } else {
        ctx.body = {
            isError: true,
            message: '系统繁忙,请稍后再试'
        }
    }
});
router.get('/authorization', async (ctx, next) => {

})

module.exports = router;
