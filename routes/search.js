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
	// SELECT * FROM doc a  WHERE CONCAT(a.title, a.html) REGEXP 'css';
	// 多个匹配时以|分割：'ic|uc|ab';
	// 查询可看https://www.cnblogs.com/interdrp/p/10727338.html
	const findDocSql = `SELECT * FROM doc a WHERE CONCAT(a.title, a.html) like '%${q}%' AND uuid='${uuid}' AND status!='-1' ORDER BY id DESC`;
	const findSpaceSql = `SELECT * FROM space b WHERE CONCAT(b.description, b.name) like '%${q}%' AND uuid='${uuid}' ORDER BY id DESC`;
	let [, docs] = await model.execute(findDocSql);
	const [, spaces] = await model.execute(findSpaceSql);
	// const pattern = new RegExp(q, 'img');
	// 搜索时返回哪个区域匹配到了，匹配到了就是返回一段html
	// docs = docs.map(doc => {
	// 	const { html = '', title = '' } = doc;
	// 	const isMatchTitle = Boolean(title.match(pattern));
	// 	const matchHtmls = html.match(pattern) || [];
	// 	console.log(`isMatchTitle:${isMatchTitle}  matchHtmls:${JSON.stringify(matchHtmls)}`);
	// 	// 如果是title，直接标红title，如果是html则前后取10个字符，如果html有多个匹配，则中间用...进行链接
	// 	const match_html = matchHtmls.reduce((p, v, index) => {
	// 	}, '');
	// 	return {
	// 		...doc,
	// 		match_html: [
	// 			isMatchTitle ? `<span style="color: red;">${html}</span>` : '',
	// 			match_html
	// 		].filter(n => n)
	// 	}
	// });
	ctx.body = serializReuslt('SUCCESS', {
		docs,
		spaces
	});
});

module.exports = router;
