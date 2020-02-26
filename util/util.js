const fs = require('fs');

module.exports = {
	writeFilePromise: function (filePath, data) {
		return new Promise((resolve, reject) => {
			fs.writeFile(filePath, data, function (err) {
				resolve(!!err);
			});
		})
	},
	// 是数组且长度大于1
	isArray: (list) => {
		return Array.isArray(list) && list.length > 0;
	},
	// 防空取参
	getIn: (data, array, initial = null) => {
		let obj = Object.assign({}, data);
		for (let i = 0; i < array.length; i++) {
			if (typeof obj !== 'object' || obj === null) {
				return initial;
			}
			const prop = array[i];
			obj = obj[prop];
		}
		if (obj === undefined || obj === null) {
			return initial;
		}
		return obj;
	},
	// 筛选返回用户信息
	getSafeUserInfo: (user) => {
		const result = { ...user };
		delete result.id;
		delete result.password;
		delete result.user_login_version;
		return result;
	},
	// 带颜色的console.log
	log: (text, color = 'white') => {
		const colors = {
			'red': '\x1b[31m',
			'black': '\x1b[30m',
			'green': '\x1b[32m',
			'yellow': '\x1b[33m',
			'blue': '\x1b[34m',
			'white': '\x1b[37m'
		};
		console.log(`${colors[color] || 'white'}${text}`);
	},
	// 增量更新，有则更新无则不改
	getAutoUpdateParams: (params) => {
		for (let key in params) {
			if (params.hasOwnProperty(key)) {
				if (params[key] === undefined) {
					delete params[key];
				}
			}
		}
		return params;
	}
}