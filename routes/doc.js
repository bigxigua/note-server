const router = require('koa-router')();
const docController = require('../controller/doc');
const CreateMysqlModel = require('../controller/sqlController');
const spaceController = require('../controller/space');
const { serializReuslt, handleCustomError } = require('../util/serializable');
const { hostname } = require('../config/server-config');
const fnv = require('fnv-plus');
const { getIn, isArray, log } = require('../util/util');
const docModel = CreateMysqlModel('doc');
const spaceModel = CreateMysqlModel('space');


/**
 * 创建一个文档
 * @param {string} space_id - 必选 空间id
 * @param {string} title - 可选 文档名称
 * @param {string} html - 可选 文档内容，基于模版创建时用到
 * @param {string} scene - 可选 节点类型，目前仅支持普通文档doc和空节点，empty_node
 * @param {object} catalogInfo - 可选 指定在哪个目录下创建该文档
 * 								{string} folderDocId 父节点docId,对应结构化catalog就是当前新增目录的上一个目录
 * 								{number} level 层级
 * @return {object} 返回docId
 */
router.post('/api/create/doc', async (ctx) => {
	const { body, url } = ctx.request;
	const { space_id, title, html, scene = 'DOC', catalogInfo = {}, uuid } = body;
	const now = new Date();
	const docId = fnv.hash(`${space_id}-${uuid}-${now}`, 64).str();
	const { folderDocId, level } = catalogInfo;
	const [, spaceInfo] = await spaceModel.find(`uuid='${uuid}' AND space_id='${space_id}'`);
	if (!Array.isArray(spaceInfo) || !spaceInfo[0] || !spaceInfo[0].catalog) {
		global.logger.error(`请求返回：UUID:${uuid};URL:${url};code: SPACE_NOT_INVALID`);
		ctx.body = handleCustomError({ message: '文档只能新建在有效的空间内' });
		return;
	}
	const catalog = JSON.parse(getIn(spaceInfo, [0, 'catalog'], '[]'));
	if (!Array.isArray(catalog) || catalog.length === 0) {
		global.logger.error(`请求返回：UUID:${uuid};URL:${url};code: SPACE_CATALOG_NOT_EXIST`);
		ctx.body = handleCustomError({ message: '目录信息有误，请另选空间' });
		return;
	}
	let index = catalog.length;

	if (folderDocId === 'top') {
		index = 0;
	} else if (folderDocId) {
		const __index__ = catalog.findIndex(n => n.docId === catalogInfo.folderDocId);
		if (__index__ !== -1) {
			index = __index__;
		}
	}

	catalog.splice(index + 1, 0, {
		docId,
		level: parseInt(level) || 0,
		status: '1',
		type: scene.toLocaleUpperCase()
	});
	const [, result] = await spaceModel.update({ catalog: JSON.stringify(catalog) }, `uuid='${uuid}' AND space_id='${space_id}'`);

	if (!getIn(result, ['changedRows'])) {
		global.logger.error(`请求返回：UUID:${uuid};URL:${url};code: SAPCE_SQL_UPDATE_ERROR`);
		ctx.body = handleCustomError({
			message: '更新目录失败，请重试'
		});
		return;
	}
	const docInfo = {
		space_id,
		updated_at: now,
		updated_at_timestamp: now.getTime(),
		draft_update_at: now,
		created_at: now,
		title,
		url: `${hostname}/article/${docId}?spaceId=${space_id}`,
		html,
		html_draft: '',
		markdown: '',
		markdown_draft: '',
		scene,
		uuid,
		status: '1',
		doc_id: docId
	};
	const [error, data] = await docModel.create(docInfo);
	if (error || !data) {
		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
		return;
	}
	// 新增完之后更新space的catalog字段
	ctx.body = serializReuslt('SUCCESS', { docId, docInfo });
});

/**
 *  获取用户文档列表
 *  @type {string} recent=最近编辑 all=获取所有的按照更新时间排序
 *  @q {string} 搜索条件
 *  @limit {string} limit
 *  @returns {Array} 文档列表
 */
router.get('/api/docs', async (ctx) => {
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
	const commonSql = `uuid='${uuid}'${q ? ` AND title LIKE '%${decodeURIComponent(q)}%'` : ' '}AND scene='doc' `;
	const pageSql = `limit ${(pageNo - 1) * pageSize},${pageSize}`;
	const orderSql = `ORDER BY id DESC`;
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
router.post('/api/doc/update', async (ctx) => {
	const { user, body } = ctx.request;
	const now = new Date();
	const updateParams = {
		updated_at_timestamp: now.getTime(),
		draft_update_at: now,
		updated_at: now
	};
	['title', 'markdown', 'html', 'markdown_draft', 'html_draft', 'title_draft', 'status', 'abstract', 'cover', 'is_share', 'is_shortcut', 'is_template'].forEach(k => {
		if (body.hasOwnProperty(k)) {
			updateParams[k] = body[k];
		}
	});
	const [error, data] = await docController.updateDoc(updateParams, `uuid='${user.uuid}' AND doc_id='${body.doc_id}'`);
	if (error || !data) {
		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
		return;
	}
	// 如果status='0'，status字段为0表示伪删除修改对应space表的catalog字段。
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
* 通过文档id获取被分享文档详情
* @param {string} docId - 文档id
*/
router.get('/api/doc/share', async (ctx) => {
	const { query: { docId } } = ctx.request;
	const [, docInfo] = await docModel.find(`doc_id='${docId}'`);
	const id = getIn(docInfo, ['0', 'doc_id']);
	const share = getIn(docInfo, ['0', 'is_share']);
	if (id && share === '1') {
		ctx.body = serializReuslt('SUCCESS', docInfo);
	} else {
		ctx.body = handleCustomError({ message: '该文档不存在或者未被分享' });
	}
});

/**
 * 获取用户属于同一个space的所有文档
 */
router.get('/api/space/docs', async (ctx) => {
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
router.post('/api/doc/delete', async (ctx) => {
	const { body: { doc_id = '', space_id = '', uuid } } = ctx.request;
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
