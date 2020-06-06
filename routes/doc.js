const router = require('koa-router')();
const docController = require('../controller/doc');
const CreateMysqlModel = require('../controller/sqlController');
const spaceController = require('../controller/space');
const { serializReuslt, handleCustomError } = require('../util/serializable');
const { hostname } = require('../config/server-config');
const fnv = require('fnv-plus');
const { getIn, isArray, safeParse, delay } = require('../util/util');
const docModel = CreateMysqlModel('doc');
const spaceModel = CreateMysqlModel('space');
const recentModel = CreateMysqlModel('recent');
const model = CreateMysqlModel();


const TYPE_MAP_SQL = {
	UPDATED: `and (html_draft='' and title_draft='')`,
	ALL: '',
	UN_UPDATED: `and (html_draft!='' or title_draft!='')`,
	DELETE: `and status='0'`,
};

async function addRecent({
	space_name,
	space_id,
	doc_title,
	doc_id,
	uuid,
	type,
}) {
	const now = Date.now();
	// 新建文档成功后添加recent
	try {
		await recentModel.create({
			uuid,
			doc_id,
			space_id,
			space_name,
			doc_title,
			type,
			created_at: now,
			update_at: now
		});
	} catch (error) {
		console.log('----create/doc新增recent失败-----', error);
	}
	return null;
}

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
	const docId = fnv.hash(`${space_id}-${uuid}-${now.getTime()}`, 64).str();
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
	// 新建文档成功后添加recent
	await addRecent({
		space_name: spaceInfo.name,
		space_id,
		doc_title: title,
		doc_id: docId,
		uuid,
		type: 'CreateEdit',
	});
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
			pageSize = 10,
			type = '',
			uuid = '',
			q = '',
			docId = ''
		}
	} = ctx.request;
	// limit sql语句
	const limitSql = `limit ${(pageNo - 1) * pageSize},${(pageNo - 1) * pageSize + pageSize};`;
	// 查详情时新增doc_id的where子句
	const detailSql = docId ? ` and doc_id='${docId}'` : '';
	// 模糊搜索时的子句
	const searchSql = q ? `concat(a.title, a.html) like '%${q}%' and` : '';
	// where子句
	const sql = `a where ${searchSql} uuid='${uuid}' and status!='-1' ${TYPE_MAP_SQL[type] || ''}`;
	let [, docs] = await model.execute(`select * from doc ${sql} ${detailSql} order by id desc ${limitSql}`);

	if (!Array.isArray(docs) || !docs.length) {
		return ctx.body = handleCustomError({ message: '查询无结果' });
	}
	let total = undefined;
	// 非详情查询时获取总页数
	if (!docId) {
		const [, counts] = await model.execute(`select sql_calc_found_rows count(*) as count from doc ${sql}`);
		total = getIn(counts, ['0', 'count']);
	}
	// 获取对应的空间信息
	const getSpaceInfo = async (spaceId) => {
		const [, d] = await spaceController.findSpace(`uuid='${uuid}' AND space_id='${spaceId}'`);
		if (Array.isArray(d) && d.length > 0 && d[0]) {
			return d[0];
		}
		return null;
	}
	// 筛选出文档的空间id列表
	const spaceIds = [...(new Set(docs.map(n => n.space_id)))];
	const promiseQueue = spaceIds.map(n => getSpaceInfo(n));
	const spaceInfos = await Promise.all(promiseQueue);
	// 给文档加上user和space(空间信息)
	docs = docs.map(doc => {
		return {
			user,
			space: spaceInfos.filter(n => n).find(n => n.space_id === doc.space_id) || {},
			...doc
		};
	});
	ctx.body = serializReuslt('SUCCESS', {
		docs,
		total: total || docs.length
	});
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
		ctx.body = handleCustomError({ message: '更新文档失败' });
		return;
	}
	// 如果status='0'，status字段为0表示伪删除修改对应space表的catalog字段。
	if (['0', '1'].includes(body.status)) {
		const sql = `uuid='${user.uuid}' AND space_id='${body.space_id}'`;
		const [, spaceInfo] = await spaceModel.find(sql);
		const catalog = JSON.parse(getIn(spaceInfo, [0, 'catalog'], '[]'));
		if (isArray(catalog)) {
			const i = catalog.findIndex(n => n.docId === body.doc_id);
			if (i !== -1) {
				catalog[i].status = body.status;
				const [, info] = await spaceModel.update({ catalog: JSON.stringify(catalog) }, sql);
				if (getIn(info, ['affectedRows'], 0) < 1) {
					ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
					return;
				}
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
		return ctx.body = handleCustomError({ message: '空间不存在' });
	}
	const [error, data] = await docController.findDocs(`uuid='${uuid}' AND space_id='${space_id}' AND status='1' limit 300`);
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
 * 如果当前文档是目录则不可删除
 * 不支持批量删除
 * 伪删除，同时修改对应空间的目录（移除该文档）
 * @param {string} doc_id - 文档id
 */
router.post('/api/doc/delete', async (ctx) => {
	const { body: { docId = '', uuid } } = ctx.request;
	const [, result] = await docModel.find(`uuid='${uuid}' AND doc_id='${docId}'`);
	const { space_id: spaceId, scene, title } = getIn(result, ['0']);

	if (!spaceId) {
		return ctx.body = handleCustomError({ message: '该文档不存在或已被删除' });
	}
	// 查询空间信息
	const [, res] = await spaceModel.find(`uuid='${uuid}' AND space_id='${spaceId}'`);
	const catalog = safeParse(getIn(res, ['0', 'catalog']), []);
	if (!Array.isArray(catalog) || catalog.length <= 1) {
	} else {
		const curIndex = catalog.findIndex(n => n.docId === docId);
		const curCatalog = catalog[curIndex];
		const nextCatalog = catalog[curIndex + 1];
		// 下一个的level比当前的大表示是当前的子文档，存在子文档不可删除
		if (curCatalog && nextCatalog && nextCatalog.level > curCatalog.level) {
			return ctx.body = handleCustomError({ message: '该文档下还有子文档，请先删除子文档后再尝试删除该文档' });
		}
		// 当前目录存在则更新空间目录
		if (curCatalog) {
			const newCatalog = catalog.reduce((p, v) => {
				(v.docId !== docId) && p.push(v);
				return p;
			}, []);
			const [, data] = await spaceModel.update({ catalog: JSON.stringify(newCatalog) }, `uuid='${uuid}' AND space_id='${spaceId}'`);
			if (getIn(data, ['changedRows']) <= 0) {
				return ctx.body = handleCustomError({ message: '更新目录失败，请重试' });
			}
		}
	}
	// 修改文档status为-1
	const [, resp] = await docModel.update({ status: '-1' }, `uuid='${uuid}' AND doc_id='${docId}'`);
	if (getIn(resp, ['changedRows']) <= 0) {
		return ctx.body = handleCustomError({ message: '删除文档失败' });
	}
	// 删除文档成功后添加recent
	await addRecent({
		space_name: res[0].name,
		space_id: spaceId,
		doc_title: title,
		doc_id: docId,
		uuid,
		type: 'PhysicalDeleteEdit',
	});
	ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
});

module.exports = router;
