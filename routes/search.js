const router = require('koa-router')();
const { serializReuslt } = require('../util/serializable');
const createModel = require('../controller/sqlController');
const model = createModel();

/**
 * 根据搜索条件，搜索用户所有符合条件的文档/空间
 * @param {string} 模糊搜索串 - 必选
 * @return {object} 返回搜索结果
 */
router.post('/api/search', async (ctx) => {
	const { body: { q, uuid } } = ctx.request;
	// 查找doc
	const findDocSql = `SELECT * FROM doc a WHERE CONCAT(a.title, a.html, a.title_draft, a.html_draft) like '%${q}%' AND uuid='${uuid}' ORDER BY id DESC`;
	const findSpaceSql = `SELECT * FROM space b WHERE CONCAT(b.description, b.name) like '%${q}%' AND uuid='${uuid}' ORDER BY id DESC`;
	const [, docs] = await model.execute(findDocSql);
	const [, spaces] = await model.execute(findSpaceSql);
	ctx.body = serializReuslt('SUCCESS', {
		docs,
		spaces
	});
});

module.exports = router;
