const router = require('koa-router')();
const docController = require('../controller/doc')
const { serializReuslt } = require('../util/serializable');
/**
 * 获取用户最近编辑的文档
 */
router.get('/recent', async (ctx, next) => {
	const { user, query: { limit = 10 } } = ctx.request;
	// 查询此前一个月内有修改的。前limit条
	const interval = 30 * 24 * 60 * 60 * 1000;
	const time = Date.now() - interval;
	const [error, data] = await docController.findDocs(`uuid='${user.uuid} AND updated_at_timestamp>${time}'`);
	if (error || !Array.isArray(data)) {
		ctx.body = serializReuslt('SPECIFIED_QUESTIONED_USER_NOT_EXIST');
		return;
	}
	ctx.body = serializReuslt('SUCCESS', {
		user,
		docs: data
	});
});

module.exports = router;
