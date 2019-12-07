const router = require('koa-router')();
const { serializReuslt } = require('../util/serializable');
const CreateMysqlModel = require('../controller/sqlController');
const fnv = require('fnv-plus');

const spaceModel = CreateMysqlModel('space');

/**
 * 创建一个空间
 */
router.post('/create/space', async (ctx) => {
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
router.get('/spaces', async (ctx) => {
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

router.post('/spaces/update', async (ctx) => {
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

module.exports = router;
