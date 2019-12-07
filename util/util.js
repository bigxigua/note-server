const fs = require('fs');

module.exports = {
	writeFilePromise: function (filePath, data) {
		return new Promise((resolve, reject) => {
			fs.writeFile(filePath, data, function (err) {
				resolve(!!err);
			});
		})
	},
	isArray: (list) => {
		return Array.isArray(list) && list.length > 0;
	},
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
	}
}