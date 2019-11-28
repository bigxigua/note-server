const router = require('koa-router')();
const recentController = require('../controller/recent');
const docController = require('../controller/doc');
const spaceController = require('../controller/space');
const { serializReuslt } = require('../util/serializable');

/**
 * 新增最新使用文档
 */
router.get('/add/recent', async (ctx) => {
	const { query: { type = '', uuid, doc_id = '', space_id = '' } } = ctx.request;
	const params = {
		uuid,
		doc_id,
		space_id,
		type,
		created_at: Date.now(),
	};
	const [error, data] = await recentController.createRecent(params);
	if (!error && data && data.affectedRows > 0) {
		ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
	} else {
		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
	}
});

/**
 * 获取最近使用列表
 */
router.get('/recents', async (ctx) => {
	const { query: { uuid, limit = 10 } } = ctx.request;
	const [error, data] = await recentController.findRecent(`uuid='${uuid}' order by created_at DESC limit ${limit}`);
	if (error || !Array.isArray(data)) {
		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
		return;
	}
	if (data.length === 0) {
		ctx.body = serializReuslt('RESULE_DATA_NONE');
		return;
	}
	const queryDoc = async ({ docId, id }) => {
		const [, d] = await docController.findDocs(`uuid='${uuid}' AND doc_id='${docId}'`);
		if (Array.isArray(d) && d.length > 0 && d[0]) {
			return {
				...d[0],
				tt: id
			};
		}
		return null;
	}
	const querySpace = async ({ spaceId, id }) => {
		const [, d] = await spaceController.findSpace(`uuid='${uuid}' AND space_id='${spaceId}'`);
		if (Array.isArray(d) && d.length > 0 && d[0]) {
			return {
				...d[0],
				tt: id
			};
		}
		return null;
	}
	const queryDocQueues = [];
	const querySpaceQueuss = [];
	data.forEach(n => {
		const { type, space_id, doc_id, id } = n;
		if (['Edit', 'CreateEdit', 'UpdateEdit', 'DeleteEdit', 'Share'].includes(type)) {
			queryDocQueues.push(queryDoc({ docId: doc_id, id }));
			querySpaceQueuss.push(querySpace({ spaceId: space_id, id }));
		}
		if (['CreateSpace', 'UpdateSpace', 'DeleteSpace'].includes(type)) {
			querySpaceQueuss.push(querySpace({ spaceId: space_id, id }));
		}
	});
	if (queryDocQueues.length > 0 || querySpaceQueuss.length > 0) {
		let docs = await Promise.all(queryDocQueues);
		let spaces = await Promise.all(querySpaceQueuss);
		docs = docs.filter(n => n);
		spaces = spaces.filter(n => n);
		data.map(p => {
			p.doc = docs.filter(i => (i.doc_id === p.doc_id && i.tt === p.id))[0] || {};
			p.space = spaces.filter(i => (i.space_id === p.space_id && i.tt === p.id))[0] || {};
			return p;
		});
	}
	ctx.body = serializReuslt('SUCCESS', data);
});

module.exports = router;