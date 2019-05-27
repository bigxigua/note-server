const { serializReuslt } = require('../util/serializable');
const { JWT_KEY } = require('../config/server-config');
const jwt = require('jsonwebtoken');
const VERIFY_RULES = {
    updateDraft: {
        comments: '更新笔记表的数据',
        methods: 'POST',
        notEmptyParamsName: ['html', 'markdown', 'subNoteId'],
        needToVerifyUser: true,
    },
    createNotebook: {
        comments: '创建新的笔记本',
        methods: 'POST',
        notEmptyParamsName: ['noteBookName'],
        needToVerifyUser: true,
    },
    getUserNotes: {
        comments: '查找用户的所有的笔记本',
        methods: 'GET',
        notEmptyParamsName: [],
        needToVerifyUser: true,
    },
    deleteSubNote: {
        comments: '删除用户指定的子笔记',
        methods: 'POST',
        notEmptyParamsName: ['type', 'subNoteId'],
        needToVerifyUser: true,
    }
};
const DEFAULT_VERIFY = {
    comments: '注释', // 注释
    methods: 'POST', // 方法
    notEmptyParamsName: [], // 需要校验的参数列表
    needToVerifyUser: false, // 需要验证user身份有效性
};
module.exports = function () {
    return async function verify(ctx, next) {
        const { cookies, request } = ctx;
        let token = cookies.get('token');
        const url = request.url.substring(1);
        const { notEmptyParamsName, needToVerifyUser } = VERIFY_RULES[url] || DEFAULT_VERIFY;
        if (!VERIFY_RULES[url]) {
            await next();
            return;
        }
        // 用户操作身份验证 -无token
        if (needToVerifyUser && !token) {
            ctx.body = serializReuslt('USER_NOT_LOGGED_IN');
            return;
        }
        let { uuid } = jwt.verify(token, JWT_KEY) || {};
        // 用户操作身份验证 -无uuid
        if (needToVerifyUser && !uuid) {
            ctx.body = serializReuslt('USER_NOT_EXIST');
            return;
        }
        // TODO 增加获取用户身份操作
        const parameterIsNotValid = notEmptyParamsName.every((key) => {
            const value = request.body[key];
            return (typeof value !== 'number' && typeof value !== 'boolean') ? request.body[key] : true;
        });
        // 参数不合法校验
        if (!parameterIsNotValid) {
            ctx.body = serializReuslt('PARAM_NOT_COMPLETE');
            return;
        }
        ctx.request.body.uuid = uuid;
        await next();
    }
}