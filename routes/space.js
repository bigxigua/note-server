const router = require('koa-router')();
const { serializReuslt, handleCustomError } = require('../util/serializable');
const CreateMysqlModel = require('../controller/sqlController');
const fnv = require('fnv-plus');

const spaceModel = CreateMysqlModel('space');
const docModel = CreateMysqlModel('doc');
const recentModel = CreateMysqlModel('recent');

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
 * 创建一个空间
 */
router.post('/api/create/space', async (ctx) => {
  const { body } = ctx.request;
  const { description, name, scene, public, uuid } = body;
  const now = new Date(Date.now());
  const spaceId = fnv.hash(`${uuid}-${now.getTime()}-${name}`, 64).str();
  const [error, data] = await spaceModel.create({
    created_at: now,
    updated_at: now,
    content_updated_at: now,
    description,
    name,
    scene,
    uuid,
    public,
    space_id: spaceId,
    catalog: JSON.stringify([{
      display_level: 0, // 默认展示的层级
      max_level: 3, // 默认可创建的最大目录层级
      type: 'META' // 头一个为meta头部信息
    }])
  });
  if (error || !data) {
    ctx.body = serializReuslt('SPECIFIED_QUESTIONED_USER_NOT_EXIST');
    return;
  }
  // 添加recent
  await addRecent({
    space_name: name,
    space_id: spaceId,
    uuid,
    type: 'CreateSpace',
  });
  ctx.body = serializReuslt('SUCCESS', { spaceId });
});

/**
 *  获取用户创建的所有空间
 *  @q {string} 搜索条件
 *  @limit {string} limit
 *  @returns {Array} 空间列表
 */
router.get('/api/spaces', async (ctx) => {
  const { query: { limit = 10, uuid, q = '' } } = ctx.request;
  // 查询此前一个月内有修改的。前limit条
  const [error, data] = await spaceModel.find(`uuid='${uuid}' ${q ? `AND name LIKE '%${q}%'` : ''}limit ${limit}`);
  if (error || !Array.isArray(data)) {
    ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
    return;
  }
  ctx.body = serializReuslt('SUCCESS', {
    spaces: data
  });
});

/**
 *  更新空间信息，更新目录、名称、描述、icon等
 *  @params  {object}  ctx - 上下文对象
 *    - space_id {string} 空间id 必选项
 *    - catalog {json} 空间目录 非必须，更新时则传
 *    - name {string} 名称 非必须，更新时则传
 *    - description {string} 空间描述 非必须，更新时则传
 *    - avatar {string} 空间avatar 非必须，更新时则传
 *    - public {string} 可见范围 非必须，更新时则传
 *  @returns null
 */
router.post('/api/spaces/update', async (ctx) => {
  const { user: { uuid } } = ctx.request;
  const updateParamsKey = ['catalog', 'name', 'description', 'avatar', 'public'];
  const body = ctx.request.body;
  const params = {
    updated_at: String(Date.now()),
  };
  for (let key in body) {
    if (updateParamsKey.indexOf(key) !== -1 && body.hasOwnProperty(key)) {
      params[key] = body[key];
    }
  }
  const [error, data] = await spaceModel.update(params, `uuid='${uuid}' AND space_id='${body.space_id}'`);
  if (error || !data) {
    ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
    return;
  }
  ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
});


// 删除空间并同时删除该空间下的文档
router.post('/api/space/delete', async (ctx) => {
  const { user: { uuid }, body: { space_id, space_name } } = ctx.request;
  const sql = `uuid='${uuid}' AND space_id='${space_id}'`;
  // 查询当前空间下是否还有文档，如果有则报错
  const [, docs] = await docModel.find(`uuid='${uuid}' AND space_id='${space_id}'`);
  if (Array.isArray(docs) && docs.length > 0) {
    ctx.body = handleCustomError({ message: '该空间下还存在文档，不可以删除，请先删除该空间下的所有文档' });
    return;
  }
  const [, result] = await spaceModel.delete(sql);
  if (result && result.affectedRows > 0) {
    // 添加recent
    await addRecent({
      space_name,
      space_id,
      uuid,
      type: 'DeleteSpace',
    });
    ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
  } else {
    ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
  }
});

module.exports = router;
