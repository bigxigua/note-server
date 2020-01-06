const router = require('koa-router')();
const docController = require('../controller/doc');
const CreateMysqlModel = require('../controller/sqlController');
const spaceController = require('../controller/space');
const { serializReuslt, handleCustomError } = require('../util/serializable');
const { hostname } = require('../config/server-config');
const fnv = require('fnv-plus');
const { getIn, isArray } = require('../util/util');
const docModel = CreateMysqlModel('doc');
const spaceModel = CreateMysqlModel('space');

/**
 * 创建一个文档
 */
router.post('/create/doc', async (ctx) => {
	const { body } = ctx.request;
	const { space_id, title, scene = 'DOC', catalogInfo = {}, uuid } = body;
	const now = new Date();
	const docId = fnv.hash(`${space_id}-${uuid}-${now}`, 64).str();
	const [, spaceInfo] = await spaceModel.find(`uuid='${uuid}' AND space_id='${space_id}'`);
	if (!Array.isArray(spaceInfo) || !spaceInfo[0] || !spaceInfo[0].catalog) {
		ctx.body = handleCustomError({ message: '未查找到空间信息' });
		return;
	}
	const catalog = JSON.parse(getIn(spaceInfo, [0, 'catalog'], '[]'));
	if (!Array.isArray(catalog) || catalog.length === 0) {
		ctx.body = handleCustomError({ message: '目录信息有误，请另选空间' });
		return;
	}
	// TODO 插入位置作为参数处理
	const index = catalogInfo.index ? catalogInfo.index : catalog.length;
	const level = catalogInfo.level || 0;
	console.log('-------index-------', index, level);
	catalog.splice(index + 1, 0, {
		docId,
		level,
		status: '1',
		type: scene.toLocaleUpperCase()
	});
	const [, result] = await spaceModel.update({ catalog: JSON.stringify(catalog) }, `uuid='${uuid}' AND space_id='${space_id}'`);

	if (!getIn(result, ['changedRows'])) {
		ctx.body = handleCustomError({
			message: '更新目录失败，请重试'
		});
		return;
	}
	const [error, data] = await docModel.create({
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
		status: '1',
		doc_id: docId
	});
	if (error || !data) {
		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
		return;
	}
	// 新增完之后更新space的catalog字段
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
	const {
		user,
		query: {
			pageNo = 1,
			pageSize = 300,
			type = 'all',
			uuid = '',
			q = '',
			docId = ''
		}
	} = ctx.request;
	const commonSql = `uuid='${uuid}'${q ? ` AND title LIKE '%${decodeURIComponent(q)}%'` : ' '}`;
	const pageSql = `limit ${(pageNo - 1) * pageSize},${pageSize}`;
	const orderSql = `ORDER BY id ASC`;
	const sqlMapType = {
		all: `${commonSql}${orderSql} ${pageSql}`,
		updated: `${commonSql}AND title_draft='' AND markdown_draft='' AND status='1' ${pageSql}`,
		un_updated: `${commonSql}AND title_draft!='' OR markdown_draft!='' AND status='1' ${pageSql}`,
		delete: `${commonSql}AND status='0' ${pageSql}`,
		detail: `uuid='${uuid}' AND doc_id='${docId}'`
	};
	if (!sqlMapType[type]) {
		ctx.body = serializReuslt('PARAM_IS_INVALID');
		return;
	}
	const [error, data] = await docModel.find(sqlMapType[type]);
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
	['title', 'markdown', 'html', 'markdown_draft', 'html_draft', 'title_draft', 'status', 'abstract', 'cover'].forEach(k => {
		if (body.hasOwnProperty(k)) {
			updateParams[k] = body[k];
		}
	});
	const [error, data] = await docController.updateDoc(updateParams, `uuid='${user.uuid}' AND doc_id='${body.doc_id}'`);
	if (error || !data) {
		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
		return;
	}
	// 如果status='0'，修改对应space表的catalog字段。
	if (['0', '1'].includes(body.status)) {
		const sql = `uuid='${user.uuid}' AND space_id='${body.space_id}'`;
		const [, spaceInfo] = await spaceModel.find(sql);
		const catalog = JSON.parse(getIn(spaceInfo, [0, 'catalog'], '[]'));
		if (isArray(catalog)) {
			const i = catalog.findIndex(n => n.docId === body.doc_id);
			catalog[i].status = body.status;
			const [, info] = await spaceModel.update({ catalog: JSON.stringify(catalog) }, sql);
			if (getIn(info, ['affectedRows'], 0) < 1) {
				ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
				return;
			}
		}
	}
	ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
});

/**
 * 获取用户属于同一个space的所有文档
 */
router.get('/space/docs', async (ctx) => {
	const { query: { space_id = '', uuid } } = ctx.request;
	const [, space] = await spaceModel.find(`uuid='${uuid}' AND space_id='${space_id}'`);
	if (!Array.isArray(space) || space.length === 0) {
		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
		return;
	}
	const [error, data] = await docController.findDocs(`uuid='${uuid}' AND space_id='${space_id}' limit 300`);
	if (error || !Array.isArray(data)) {
		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
		return;
	}
	ctx.body = serializReuslt('SUCCESS', {
		docs: data,
		space: space[0]
	});
});

/**
 * 删除文档
 * 支持同时删除多个文档，多个时已应为逗号分隔
 */
router.post('/doc/delete', async (ctx) => {
	const { body: { doc_id = '', space_id = '', uuid } } = ctx.request;
	console.log('---------------', doc_id);
	const docId = doc_id.split(',').map(n => `'${n}'`).join(',');
	const [error, data] = await docController.deleteDoc(`uuid='${uuid}' AND doc_id in (${docId})`);
	// 删除时也要删除掉对应space表的catalog对应的项
	if (!error && data && data.affectedRows > 0) {
		const sql = `uuid='${uuid}' AND space_id='${space_id}'`;
		const [, spaceInfo] = await spaceModel.find(sql);
		const catalog = JSON.parse(getIn(spaceInfo, [0, 'catalog'], '[]'));
		if (isArray(catalog)) {
			doc_id.split(',').forEach(id => {
				const i = catalog.findIndex(n => n.docId === id);
				catalog.splice(i, 1);
			});
			const [, info] = await spaceModel.update({ catalog: JSON.stringify(catalog) }, sql);
			if (getIn(info, ['affectedRows'], 0) < 1) {
				ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
				return;
			}
		}
		ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
	} else {
		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
	}
});

module.exports = router;
