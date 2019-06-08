const { serializReuslt } = require('../util/serializable');
const { JWT_KEY } = require('../config/server-config');
const jwt = require('jsonwebtoken');
const userController = require('../controller/user');
const VERIFY_RULES = {
    outLogin: {
        comments: '退出登陆',
        methods: 'POST',
        notEmptyParamsName: [],
        needToVerifyUser: true,
    },
    updateDraft: {
        comments: '更新笔记表的数据',
        methods: 'POST',
        notEmptyParamsName: ['subNoteId'],
        needToVerifyUser: true,
    },
    createNotebook: {
        comments: '创建新的笔记本',
        methods: 'POST',
        notEmptyParamsName: ['noteBookName'],
        needToVerifyUser: true,
    },
    createSubNotebook: {
        comments: '创建新的子笔记',
        methods: 'POST',
        notEmptyParamsName: ['notebookId', 'subNoteName'],
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
    },
    getRecentEditorSubnote: {
        comments: '获取用户最近编辑的子笔记信息',
        methods: 'GET',
        notEmptyParamsName: [],
        needToVerifyUser: true,
    },
    updateSubnoteInfo: {
        comments: '更新子笔记信息',
        methods: 'GET',
        notEmptyParamsName: [],
        needToVerifyUser: true,
    },
    searchSubNote: {
        comments: '搜索子笔记',
        methods: 'GET',
        notEmptyParamsName: ['subNoteName'],
        needToVerifyUser: true,
    },
    uploadImage: {
        comments: '上传图片',
        methods: 'POST',
        notEmptyParamsName: ['fileId'],
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
        const url = request.url.split('?')[0].substring(1);
        const method = request.method;
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
        let { uuid, userLoginVersion } = jwt.verify(token, JWT_KEY) || {};
        // 用户操作身份验证 -无uuid
        if (needToVerifyUser && !uuid) {
            ctx.body = serializReuslt('USER_NOT_EXIST');
            return;
        }
        const parameterIsNotValid = notEmptyParamsName.every((key) => {
            const value = request[method === 'POST' ? 'body' : 'query'][key];
            return (typeof value !== 'number' && typeof value !== 'boolean') ? value : true;
        });
        // 参数不合法校验
        if (!parameterIsNotValid) {
            ctx.body = serializReuslt('PARAM_NOT_COMPLETE');
            return;
        }
        // 用户登陆身份有效性校验
        let user = await userController.findUser(`uuid='${uuid}'`);
        if (!user || !user[0] || user[0].user_login_version !== userLoginVersion) {
            ctx.body = serializReuslt('USER_INVALIDATION_OF_IDENTITY');
            return;
        }
        ctx.request.body.uuid = uuid;
        ctx.request.query.uuid = uuid;
        await next();
    }
}