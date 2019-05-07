const fs = require('fs');

module.exports = {
	writeFilePromise: function (filePath, data) {
		return new Promise((resolve, reject) => {
			fs.writeFile(filePath, data, function (err) {
				resolve(!!err);
			});
		})
	}
}