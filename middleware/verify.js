const { serializReuslt } = require('../util/serializable');
const { JWT_KEY } = require('../config/server-config');
const jwt = require('jsonwebtoken');
const userController = require('../controller/user');
const VERIFY_RULES = {
	'api/docs': {
		match: /^api\/docs(\/)?$/,
		methods: 'GET',
		notEmptyParamsName: [],
		needToVerifyUser: true,
	},
	'api/create/doc': {
		match: /^api\/create\/doc(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['space_id', 'title', 'scene'],
		needToVerifyUser: true,
	},
	'api/doc/detail': {
		match: /^api\/doc\/detail(\/)?$/,
		methods: 'GET',
		notEmptyParamsName: ['doc_id'],
		needToVerifyUser: true,
	},
	'api/doc/update': {
		match: /^api\/doc\/update(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['doc_id'],
		needToVerifyUser: true,
	},
	'api/doc/delete': {
		match: /^api\/doc\/delete(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['doc_id', 'space_id'],
		needToVerifyUser: true,
	},
	'api/add/recent': {
		match: /^api\/add\/recent(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['type'],
		needToVerifyUser: true,
	},
	'api/delete/recent': {
		match: /^api\/delete\/recent(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['id'],
		needToVerifyUser: true,
	},
	'api/recents': {
		match: /^api\/recents(\/)?$/,
		methods: 'GET',
		notEmptyParamsName: [],
		needToVerifyUser: true,
	},
	'api/space/docs': {
		match: /^api\/space\/docs(\/)?$/,
		methods: 'GET',
		notEmptyParamsName: ['space_id'],
		needToVerifyUser: true,
	},
	'api/create/space': {
		match: /^api\/create\/space(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['public', 'scene', 'name', 'description'],
		needToVerifyUser: true,
	},
	'api/spaces': {
		match: /^api\/spaces(\/)?$/,
		methods: 'GET',
		notEmptyParamsName: [],
		needToVerifyUser: true,
	},
	'api/spaces/update': {
		match: /^api\/spaces\/update(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['space_id'],
		needToVerifyUser: true,
	},
	'api/spaces/delete': {
		match: /^api\/spaces\/delete(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['space_id'],
		needToVerifyUser: true,
	},
	'api/login/out': {
		match: /^api\/login\/out(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: [],
		needToVerifyUser: true,
	},
	'api/create/template': {
		match: /^api\/create\/template(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['html', 'url'],
		needToVerifyUser: true,
	},
	'api/templates': {
		match: /^api\/templates(\/)?$/,
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
		let jwtVerifyResult = {}
		try {
			jwtVerifyResult = jwt.verify(token, JWT_KEY) || {};
		} catch (error) {
		}
		const { uuid, userLoginVersion } = jwtVerifyResult;
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