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
	getSafeUserInfo: (user) => {
		const result = { ...user };
		delete result.id;
		delete result.password;
		delete result.user_login_version;
		return result;
	}
}