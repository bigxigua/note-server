const router = require('koa-router')();
const docController = require('../controller/doc');
const spaceController = require('../controller/space');
const { serializReuslt } = require('../util/serializable');
const { hostname } = require('../config/server-config');
const fnv = require('fnv-plus');

/**
 * 创建一个空间
 */
router.post('/create/doc', async (ctx) => {
	const { body } = ctx.request;
	const { space_id, title, scene, uuid } = body;
	const now = new Date();
	const docId = fnv.hash(`${space_id}-${uuid}-${now}`, 64).str();
	const [error, data] = await docController.createDoc({
		space_id,
		updated_at: now,
		updated_at_timestamp: now.getTime(),
		draft_update_at: now,
		created_at: now,
		title,
		url: `${hostname}/article/${docId}?spaceId=${space_id}`,
		html: '',
		html_draft: '',
		markdown: '',
		markdown_draft: '',
		scene,
		uuid,
		doc_id: docId
	});
	if (error || !data) {
		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
		return;
	}
	ctx.body = serializReuslt('SUCCESS', { docId });
});

/**
 *  获取用户文档列表
 *  @type {string} recent=最近编辑 all=获取所有的按照更新时间排序
 *  @q {string} 搜索条件
 *  @limit {string} limit
 *  @returns {Array} 文档列表
 */
router.get('/docs', async (ctx) => {
	const { user, query: { limit = 10, type = 'all', uuid = '', q = '', docId = '' } } = ctx.request;
	// 查询此前一个月内有修改的。前limit条
	const interval = 30 * 24 * 60 * 60 * 1000;
	const time = Date.now() - interval;
	const sqlMapType = {
		recent: `uuid='${uuid}' ${q ? `AND title LIKE '%${q}%'` : ''} order by updated_at_timestamp DESC limit ${limit}`,
		all: `uuid='${uuid}' ${q ? `AND title LIKE '%${q}%'` : ''} AND updated_at_timestamp>${time} limit ${limit}`,
		detail: `uuid='${uuid}' AND doc_id='${docId}'`
	};
	if (!sqlMapType[type]) {
		ctx.body = serializReuslt('PARAM_IS_INVALID');
		return;
	}
	const [error, data] = await docController.findDocs(sqlMapType[type]);
	if (error || !Array.isArray(data)) {
		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
		return;
	}
	const getSpaceInfo = async ({ spaceId }) => {
		const [, d] = await spaceController.findSpace(`uuid='${uuid}' AND space_id='${spaceId}'`);
		if (Array.isArray(d) && d.length > 0 && d[0]) {
			return d[0];
		}
		return null;
	}
	const promiseQueue = [];
	data.forEach(n => { promiseQueue.push(getSpaceInfo({ spaceId: n.space_id })) });
	let result = await Promise.all(promiseQueue);
	result = result.filter(n => n);
	if (result.length > 0) {
		data.map(n => {
			n.user = user;
			for (let i = 0; i < result.length; i++) {
				if (result[i]['space_id'] === n.space_id) {
					n.space = result[i];
					break;
				}
			}
		});
	}
	ctx.body = serializReuslt('SUCCESS', data);
});

/**
 * 根据docId查找文档详细信息
 */
// router.get('/doc/detail', async (ctx) => {
// 	const { user, query: { doc_id = '' } } = ctx.request;
// 	// 查询此前一个月内有修改的。前limit条
// 	const [error, data] = await docController.findDocs(`uuid='${user.uuid}' AND doc_id='${doc_id}'`);
// 	if (error || !Array.isArray(data) || data.length === 0) {
// 		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
// 		return;
// 	}
// 	ctx.body = serializReuslt('SUCCESS', {
// 		...data[0]
// 	});
// });

/**
 * 更新文档
 */
router.post('/doc/update', async (ctx) => {
	const { user, body } = ctx.request;
	const now = new Date();
	const updateParams = {
		updated_at_timestamp: now.getTime(),
		draft_update_at: now,
		updated_at: now
	};
	['title', 'markdown', 'html', 'markdown_draft', 'html_draft', 'title_draft', 'status'].forEach(k => {
		if (body.hasOwnProperty(k)) {
			updateParams[k] = body[k];
		}
	});
	console.log('updateParams', updateParams);
	const [error, data] = await docController.updateDoc(updateParams, `uuid='${user.uuid}' AND doc_id='${body.doc_id}'`);
	if (error || !data) {
		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
		return;
	}
	ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
});

/**
 * 获取用户属于同一个space的所有文档
 */
router.get('/space/docs', async (ctx) => {
	const { query: { space_id = '', uuid } } = ctx.request;
	const [error, data] = await docController.findDocs(`uuid='${uuid}' AND space_id='${space_id}'`);
	if (error || !Array.isArray(data) || data.length === 0) {
		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
		return;
	}
	ctx.body = serializReuslt('SUCCESS', data);
});


module.exports = router;
