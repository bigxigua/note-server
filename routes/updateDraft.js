const router = require('koa-router')();
const jwt = require('jsonwebtoken');
const fnv = require('fnv-plus');
const userController = require('../controller/user');
const notebookController = require('../controller/notebook');
const { serializReuslt } = require('../util/serializable');
const { JWT_KEY } = require('../config/server-config');
/**
 * login 路由
 *  1. 用户身份有效性验证
 *  2. 更新笔记表的数据
 *  3. 更新用户表的notebooks
 */
router.post('/updateDraft', async (ctx, next) => {
    let token = ctx.cookies.get('token');
    if (!token) {
        ctx.body = serializReuslt('USER_NOT_LOGGED_IN');
        return;
    }
    let { account } = jwt.verify(token, JWT_KEY) || {};
    if (account) {
        let user = await userController.findUser(account);
        // TODO 需要拿到文章的唯一id来判断文章是新建保存还是更新
        ctx.body = serializReuslt('SUCCESS');
        console.log('--------user-------', user);
    } else {
        ctx.body = serializReuslt('USER_NOT_EXIST');
    }
});

/**
 * createNotebook 创建新的笔记本
 */
router.post('/createNotebook', async (ctx, next) => {
    let token = ctx.cookies.get('token');
    let { noteBookName } = ctx.request.body;
    if (!token) {
        ctx.body = serializReuslt('USER_NOT_LOGGED_IN');
        return;
    }
    let { uuid } = jwt.verify(token, JWT_KEY) || {};
    if (uuid) {
        // 创建新的笔记本时会新建一个新的笔记条目
        const createResult = await notebookController.createNotebook({
            notebook_id: fnv.hash(noteBookName, 64),
            notebook_name: noteBookName,
            user_id: uuid,
            html: '<p>这是一个新的笔记</p>↵',
            markdown: '这是一个新的笔记',
            title: '标题'
        });
        if (createResult) {
            ctx.body = serializReuslt('SUCCESS', createResult);
        } else {
            ctx.body = serializReuslt('DATA_CREATE_FAILED');
        }
    } else {
        ctx.body = serializReuslt('USER_NOT_EXIST');
    }
});

module.exports = router;
