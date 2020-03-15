const router = require('koa-router')();
const { serializReuslt, handleCustomError } = require('../util/serializable');
const CreateMysqlModel = require('../controller/sqlController');
const fnv = require('fnv-plus');
const { getIn, getAutoUpdateParams } = require('../util/util');

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
  ctx.body = serializReuslt('SUCCESS', {
    STATUS: 'OK',
    data: {
      title,
      url,
      shortcut_id: shortcutId,
      order_num: orderNum,
      uuid,
      type
    }
  });
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
router.post('/api/delete/shortcut', async (ctx) => {
  const { user: { uuid }, body: { shortcutId } } = ctx.request;
  const sql = `uuid='${uuid}' AND shortcut_id='${shortcutId}'`;
  const [error, data] = await shortcutModel.delete(sql);
  if (!error && data && data.affectedRows > 0) {
    ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
  } else {
    ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
  }
});

/**
 *  更新快捷入口信息，排序
 */
router.post('/api/shortcut/order', async (ctx) => {
  const { user: { uuid }, body } = ctx.request;
  const params = {
    updated_at: String(Date.now()),
  };
  const {
    sourceShortcutId = '',
    sourceOrderNum = '',
    destinationShortcutId = '',
    destinationOrderNum
  } = body;
  const updateSourceSql = `uuid='${uuid}' AND shortcut_id='${sourceShortcutId}'`;
  const destinationShortcutSql = `uuid='${uuid}' AND shortcut_id='${destinationShortcutId}'`;
  const updateSourceParams = {
    order_num: destinationOrderNum
  };
  const destinationParams = {
    order_num: sourceOrderNum
  };
  const results = await Promise.all([
    shortcutModel.update(updateSourceParams, updateSourceSql),
    shortcutModel.update(destinationParams, destinationShortcutSql),
  ]);
  if (results[0] && results[0][1] && results[0][1].affectedRows > 0 &&
    results[1] && results[1][1]) {
    ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
  } else {
    ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
  }
});

module.exports = router;
