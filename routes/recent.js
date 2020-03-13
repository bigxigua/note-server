const router = require('koa-router')();
const { serializReuslt } = require('../util/serializable');
const CreateMysqlModel = require('../controller/sqlController');
const { getIn, getSafeUserInfo, getAutoUpdateParams, log } = require('../util/util');

const recentModel = CreateMysqlModel('recent');
const docModel = CreateMysqlModel('doc');
const spaceModel = CreateMysqlModel('space');

const SPACE_ACTIONS = ['CreateSpace', 'UpdateSpace', 'DeleteSpace'];
const DOC_ACTIONS = ['CreateEdit', 'UpdateEdit', 'LogicalDeleteEdit', 'PhysicalDeleteEdit', 'Share', 'RestoreEdit'];

/**
 * 新增最新使用文档
 */
router.post('/api/add/recent', async (ctx) => {
	const { body:
		{
			type = '',
			uuid,
			doc_id,
			space_id,
			space_name,
			doc_title
		}
	} = ctx.request;
	let sql = '';

	const isAboutSpace = SPACE_ACTIONS.includes(type);
	const isAboutDoc = DOC_ACTIONS.includes(type);

	if (isAboutDoc) {
		sql = `uuid='${uuid}' AND doc_id='${doc_id}' AND space_id='${space_id}'`;
	} else if (isAboutSpace) {
		sql = `uuid='${uuid}' AND space_id='${space_id}' AND doc_id=''`;
	}
	if (!sql) {
		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
		return;
	}
	// 如果当前记录已经存在，则做update操作，比如针对某个文档的新增/编辑/更新均只记录一次，以最新操作为准，知识库同理
	const [, recentInfo] = await recentModel.find(sql);
	const now = String(Date.now());

	if (getIn(recentInfo, [0, 'id'])) {
		const updateParams = isAboutDoc
			? getAutoUpdateParams({
				space_id,
				space_name,
				doc_title
			}) : getAutoUpdateParams({ space_name });
		console.log('=----====>>>', updateParams);
		const [, updateResult] = await recentModel.update({
			type,
			update_at: now,
			...updateParams,
		}, sql);
		if (updateResult.changedRows) {
			ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
		} else {
			ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
		}
		return;
	}
	const params = {
		uuid,
		doc_id,
		space_id,
		space_name,
		doc_title,
		type,
		created_at: now,
		update_at: now
	};
	const [error, data] = await recentModel.create(params);
	if (!error && data && data.affectedRows > 0) {
		ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
	} else {
		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
	}
});

/**
 * 物理删除最新使用文档
 */
router.post('/api/delete/recent', async (ctx) => {
	const { body: { uuid, id } } = ctx.request;
	const [error, data] = await recentModel.delete(`uuid='${uuid}' AND id=${parseInt(id)}`);
	if (!error && data && data.affectedRows > 0) {
		ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
	} else {
		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
	}
});

/**
 * 获取最近使用列表
 */
router.get('/api/recents', async (ctx) => {
	const { query: { uuid, limit = 10 }, user } = ctx.request;
	const [error, data] = await recentModel.find(`uuid='${uuid}' order by update_at DESC limit ${limit}`);
	if (error || !Array.isArray(data)) {
		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
		return;
	}
	if (data.length === 0) {
		ctx.body = serializReuslt('RESULE_DATA_NONE');
		return;
	}
	const queryDoc = async ({ docId, id, title }) => {
		const [, d] = await docModel.find(`uuid='${uuid}' AND doc_id='${docId}'`);
		if (Array.isArray(d) && d.length > 0 && d[0]) {
			return {
				...d[0],
				tt: id
			};
		}
		return null;
	}
	const querySpace = async ({ spaceId, id }) => {
		const [, d] = await spaceModel.find(`uuid='${uuid}' AND space_id='${spaceId}'`);
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
		const { type, space_id, doc_id, id, doc_title } = n;
		if (['Edit', 'CreateEdit', 'UpdateEdit', 'LogicalDeleteEdit', 'PhysicalDeleteEdit', 'Share'].includes(type)) {
			queryDocQueues.push(queryDoc({ docId: doc_id, id, title: doc_title }));
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
			p.user = getSafeUserInfo(user);
			return p;
		});
	}
	const list = data.filter(n => n.update_at);
	ctx.body = serializReuslt('SUCCESS', list);
});

module.exports = router;