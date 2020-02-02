const router = require('koa-router')();
const { serializReuslt } = require('../util/serializable');
const CreateMysqlModel = require('../controller/sqlController');
const fnv = require('fnv-plus');

const spaceModel = CreateMysqlModel('space');
const docModel = CreateMysqlModel('doc');

/**
 * 创建一个空间
 */
router.post('/api/create/space', async (ctx) => {
  const { body } = ctx.request;
  const { description, name, scene, public, uuid } = body;
  const now = new Date(Date.now());
  const spaceId = fnv.hash(`${uuid}-${now}-${name}`, 64).str();
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

// 更新空间信息
router.post('/api/spaces/update', async (ctx) => {
  const { user: { uuid }, body: { space_id, catalog } } = ctx.request;
  const [error, data] = await spaceModel.update({
    updated_at: new Date(),
    catalog
  }, `uuid='${uuid}' AND space_id='${space_id}'`);
  if (error || !data) {
    ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
    return;
  }
  ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
});
// 删除空间并同时删除该空间下的文档
router.post('/api/spaces/delete', async (ctx) => {
  const { user: { uuid }, body: { space_id } } = ctx.request;
  const sql = `uuid='${uuid}' AND space_id='${space_id}'`;
  const results = await Promise.all([spaceModel.delete(sql), docModel.delete(sql)]);
  console.log(results);
  if (results[0] && results[0][1] && results[0][1].affectedRows > 0 &&
    results[1] && results[1][1] && results[1][1].affectedRows > 0) {
    ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
  } else {
    ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
  }
});

module.exports = router;
