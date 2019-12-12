const { serializReuslt } = require('../util/serializable');
const { JWT_KEY } = require('../config/server-config');
const jwt = require('jsonwebtoken');
const userController = require('../controller/user');

const VERIFY_RULES = {
	'docs': {
		match: /^docs(\/)?$/,
		methods: 'GET',
		notEmptyParamsName: [],
		needToVerifyUser: true,
	},
	'create/doc': {
		match: /^create\/doc(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['space_id', 'title', 'scene'],
		needToVerifyUser: true,
	},
	'doc/detail': {
		match: /^doc\/detail(\/)?$/,
		methods: 'GET',
		notEmptyParamsName: ['doc_id'],
		needToVerifyUser: true,
	},
	'doc/update': {
		match: /^doc\/update(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['doc_id'],
		needToVerifyUser: true,
	},
	'doc/delete': {
		match: /^doc\/delete(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['doc_id'],
		needToVerifyUser: true,
	},
	'add/recent': {
		match: /^add\/recent(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['type'],
		needToVerifyUser: true,
	},
	'delete/recent': {
		match: /^delete\/recent(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['id'],
		needToVerifyUser: true,
	},
	'recents': {
		match: /^recents(\/)?$/,
		methods: 'GET',
		notEmptyParamsName: [],
		needToVerifyUser: true,
	},
	'space/docs': {
		match: /^space\/docs(\/)?$/,
		methods: 'GET',
		notEmptyParamsName: ['space_id'],
		needToVerifyUser: true,
	},
	'create/space': {
		match: /^create\/space(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['public', 'scene', 'name', 'description'],
		needToVerifyUser: true,
	},
	'spaces': {
		match: /^spaces(\/)?$/,
		methods: 'GET',
		notEmptyParamsName: [],
		needToVerifyUser: true,
	},
	'spaces/update': {
		match: /^spaces\/update(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['space_id', 'catalog'],
		needToVerifyUser: true,
	},
	'login/out': {
		match: /^login\/out(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: [],
		needToVerifyUser: true,
	},
	// 'upload/image': {
	// 	match: /^upload\/image(\/)?$/,
	// 	methods: 'POST',
	// 	notEmptyParamsName: [],
	// 	needToVerifyUser: true,
	// }
};
module.exports = function () {
	return async function verify(ctx, next) {
		const { cookies, request } = ctx;
		const token = cookies.get('token');
		const url = request.url.split('?')[0].substring(1);
		const matched = Object.keys(VERIFY_RULES).filter(n => {
			return VERIFY_RULES[n].match.test(url);
		});
		if (matched.length === 0) {
			await next();
			return;
		}
		const method = request.method;
		const { notEmptyParamsName, needToVerifyUser } = VERIFY_RULES[url];
		// 用户操作身份验证 -无token
		if (needToVerifyUser && !token) {
			ctx.body = serializReuslt('USER_NOT_LOGGED_IN');
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
		const { uuid, userLoginVersion } = jwt.verify(token, JWT_KEY) || {};
		// 用户操作身份验证 -无uuid
		if (needToVerifyUser && !uuid) {
			ctx.body = serializReuslt('USER_NOT_EXIST');
			return;
		}
		// 获取用户信息失败
		const [error, user] = await userController.findUser(`uuid='${uuid}'`);
		if (error || !user || !user[0] || user[0].user_login_version !== userLoginVersion) {
			ctx.body = serializReuslt('USER_INVALIDATION_OF_IDENTITY');
			return;
		}
		ctx.request.user = user[0];
		ctx.request.body.uuid = uuid;
		ctx.request.query.uuid = uuid;
		await next();
	}
}