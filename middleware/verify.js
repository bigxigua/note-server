const fs = require('fs');
const path = require('path');
const { serializReuslt } = require('../util/serializable');
const { JWT_KEY, isDevelopment } = require('../config/server-config');
const VERIFY_RULES = require('../config/route.verify.config');
const jwt = require('jsonwebtoken');
const userController = require('../controller/user');
const { safeStringify } = require('../util/util');

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

async function getIps() {
	const configFileName = path.join(__dirname, '../upload') + `/config.json`;
	const configJson = await fs.readFileSync(configFileName, { encoding: 'utf-8' });
	const ips = JSON.parse(configJson || '{}').ips || [];
	return ips;
}

module.exports = function () {
	return async function verify(ctx, next) {
		const { cookies, request, req } = ctx;
		const method = request.method;
		const token = cookies.get('token');
		const url = request.url.split('?')[0].substring(1);
		const realIp = getClientIp(req);

		const matched = Object.keys(VERIFY_RULES).filter(n => {
			return VERIFY_RULES[n].match.test(url);
		});

		if (matched.length === 0) {
			await next();
			return;
		}

		const {
			notEmptyParamsName,
			needToVerifyUser,
			access
		} = VERIFY_RULES[url];

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
		if (!needToVerifyUser) {
			await next();
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
		// 获取ips
		const ips = await getIps();
		// 未拥有该操作的权限
		if (!isDevelopment
			&& access === 'SUPER_ADMIN'
			&& ips.indexOf(realIp) === -1
			&& OPEN_UUIDS.indexOf(uuid) !== -1) {
			ctx.body = serializReuslt('USER_PERMISSION_DENIED');
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
		ctx.request.query.__realIp__ = realIp;
		ctx.request.body.__realIp__ = realIp;

		const params = safeStringify(request[method === 'POST' ? 'body' : 'query']);

		global.logger.info(`收到来自请求：ACCOUNT:${user[0].account};UUID:${uuid};REAL_IP:${realIp};PATH：${url};METHOD:${method};PARAMS:${params}`);
		await next();
	}
}