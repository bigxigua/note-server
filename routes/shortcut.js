const router = require('koa-router')();
const { serializReuslt, handleCustomError } = require('../util/serializable');
const CreateMysqlModel = require('../controller/sqlController');
const fnv = require('fnv-plus');
const { getIn } = require('../util/util');

const shortcutModel = CreateMysqlModel('shortcut');

/**
 * 创建一个快捷入口
 */
router.post('/api/create/shortcut', async (ctx) => {
  const { body } = ctx.request;
  const { title, url, type, uuid } = body;
  const now = String(Date.now());
  const shortcutId = fnv.hash(`${uuid}-${now}-${title}-${url}`, 64).str();
  const [, result] = await shortcutModel.execute(`select max(id) from shortcut`);
  const orderNum = getIn(result, [0, 'max(id)'], 0) + 1;
  const [error, data] = await shortcutModel.create({
    uuid,
    title,
    url,
    type,
    order_num: orderNum,
    shortcut_id: shortcutId,
    created_at: now,
    updated_at: now
  });
  if (error || !data) {
    ctx.body = handleCustomError({ message: '添加快捷入口失败，请重试！' });
    return;
  }
  ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
});

/**
 *  获取用户创建的所有快捷入口
 *  @q {string} 搜索条件
 *  @returns {Array} 快捷入口列表
 */
router.get('/api/shortcut', async (ctx) => {
  const { query: { uuid, q = '' } } = ctx.request;
  const [error, data] = await shortcutModel.find(`uuid='${uuid}' ${q ? `AND name LIKE '%${q}%'` : ''}limit 200`);
  if (error || !Array.isArray(data)) {
    ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
    return;
  }
  ctx.body = serializReuslt('SUCCESS', data);
});


/**
 *  删除某个快捷入口
 *  @returns {Array} 空间列表
 */
router.post('/api/shortcut/delete', async (ctx) => {
  // const { user: { uuid }, body: { space_id } } = ctx.request;
  // const sql = `uuid='${uuid}' AND space_id='${space_id}'`;
  // const results = await Promise.all([spaceModel.delete(sql), docModel.delete(sql)]);
  // if (results[0] && results[0][1] && results[0][1].affectedRows > 0 &&
  //   results[1] && results[1][1]) {
  //   ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
  // } else {
  //   ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
  // }
});

module.exports = router;
