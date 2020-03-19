const { serializReuslt } = require('../util/serializable');
const { JWT_KEY, isDevelopment } = require('../config/server-config');
const jwt = require('jsonwebtoken');
const userController = require('../controller/user');

// 拥有超级管理员权限的ip地址
const SUPER_ADMIN_IP = ['115.172.87.49'];
// 需要开放权限的uuid
const OPEN_UUIDS = ['1ojwj6x7payrz'];

function getClientIp(req) {
	let ip = '';
	try {
		ip = req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
			req.connection.remoteAddress || // 判断 connection 的远程 IP
			req.socket.remoteAddress || // 判断后端的 socket 的 IP
			req.connection.socket.remoteAddress;
	} catch (error) {
	}
	if (/127\.0\.0\.1/.test(ip)) {
		ip = '';
	}
	return ip;
}

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
		access: 'SUPER_ADMIN',
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
		access: 'SUPER_ADMIN',
		needToVerifyUser: true,
	},
	'api/doc/delete': {
		match: /^api\/doc\/delete(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['doc_id', 'space_id'],
		access: 'SUPER_ADMIN',
		needToVerifyUser: true,
	},
	'api/add/recent': {
		match: /^api\/add\/recent(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['type'],
		access: 'SUPER_ADMIN',
		needToVerifyUser: true,
	},
	'api/delete/recent': {
		match: /^api\/delete\/recent(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['id'],
		access: 'SUPER_ADMIN',
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
		access: 'SUPER_ADMIN',
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
		access: 'SUPER_ADMIN',
		needToVerifyUser: true,
	},
	'api/spaces/delete': {
		match: /^api\/spaces\/delete(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['space_id'],
		access: 'SUPER_ADMIN',
		needToVerifyUser: true,
	},
	'api/create/template': {
		match: /^api\/create\/template(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['html', 'url'],
		access: 'SUPER_ADMIN',
		needToVerifyUser: true,
	},
	'api/templates': {
		match: /^api\/templates(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: [],
		needToVerifyUser: true,
	},
	'api/create/shortcut': {
		match: /^api\/create\/shortcut(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['title', 'url', 'type'],
		access: 'SUPER_ADMIN',
		needToVerifyUser: true,
	},
	'api/delete/shortcut': {
		match: /^api\/delete\/shortcut(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['shortcutId'],
		access: 'SUPER_ADMIN',
		needToVerifyUser: true,
	},
	'api/shortcut/order': {
		match: /^api\/shortcut\/order(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['sourceShortcutId', 'sourceOrderNum', 'destinationOrderNum'],
		access: 'SUPER_ADMIN',
		needToVerifyUser: true,
	},
	'api/shortcut': {
		match: /^api\/shortcut(\/)?$/,
		methods: 'GET',
		notEmptyParamsName: [],
		needToVerifyUser: true,
	},
	'api/search': {
		match: /^api\/search(\/)?$/,
		methods: 'POST',
		notEmptyParamsName: ['q'],
		needToVerifyUser: true,
	}
};
module.exports = function () {
	return async function verify(ctx, next) {
		const { cookies, request, req } = ctx;
		const method = request.method;
		const token = cookies.get('token');
		const url = request.url.split('?')[0].substring(1);
		const realIp = getClientIp(req);

		console.log('realIp', realIp);

		const matched = Object.keys(VERIFY_RULES).filter(n => {
			return VERIFY_RULES[n].match.test(url);
		});

		if (matched.length === 0) {
			await next();
			return;
		}

		const { notEmptyParamsName, needToVerifyUser, access } = VERIFY_RULES[url];

		// 需要登陆态但无token时
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
		// 未拥有该操作的权限
		if (!isDevelopment && access === 'SUPER_ADMIN' && SUPER_ADMIN_IP.indexOf(realIp) === -1 && OPEN_UUIDS.indexOf(uuid) !== -1) {
			ctx.body = serializReuslt('USER_PERMISSION_DENIED');
			return;
		}
		// if (access === 'SUPER_ADMIN') {
		// 	ctx.body = serializReuslt('USER_PERMISSION_DENIED');
		// 	return;
		// }
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