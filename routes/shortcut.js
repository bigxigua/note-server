const router = require('koa-router')();
const { serializReuslt, handleCustomError } = require('../util/serializable');
const CreateMysqlModel = require('../controller/sqlController');
const fnv = require('fnv-plus');
const { getIn, delay } = require('../util/util');

const shortcutModel = CreateMysqlModel('shortcut');

/**
 * 将文档或者空间添加到首页的快捷入口
 * @param {string} title - 可选 模版文档名称，默认为“模版文档”
 * @param {string} type - 可选 类型[ENUM('XIGUA_DOC', 'XIGUA_SPACE', 'NORMAL')] 默认XIGUA_DOC
 * @param {string} signId - 必须 如果是文档就是传docId,空间就传space_id,其他链接就传链接名称
 * @param {string} url - 必选 被选作模版的文档地址
 */
router.post('/api/create/shortcut', async (ctx) => {
  const { body } = ctx.request;
  const { title, url, type, uuid, signId } = body;
  const now = String(Date.now());
  const shortcutId = fnv.hash(`${uuid}-${now}-${title}-${url}`, 64).str();
  if (signId) {
    const [, data] = await shortcutModel.find(`uuid='${uuid}' AND sign_id='${signId}'`);
    if (Array.isArray(data) && data.length) {
      ctx.body = handleCustomError({ message: '该文档/空间/链接已被添加，请勿重复添加' });
      return;
    }
  }
  // TODO 如果type为XIGUA_DOC|XIGUA_SPACE需要更新对应到文档或空间
  // const [error, data] = await docModel.update({ is_template: '1' }, `uuid='${uuid}' AND doc_id='${docId}'`);
  // if (error || !data) {
  //   ctx.body =handleCustomError({ message: '更新' });
  //   return;
  // }
  const [, result] = await shortcutModel.execute(`select max(order_num) from shortcut`);
  const orderNum = getIn(result, [0, 'max(order_num)'], 0) + 1;
  const [error, data] = await shortcutModel.create({
    uuid,
    title,
    url,
    type,
    sign_id: signId,
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
  const [error, data] = await shortcutModel.find(`uuid='${uuid}' ${q ? `AND name LIKE '%${q}%'` : ''}order by order_num DESC limit 200`);
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
  const now = String(Date.now());
  const { sourceShortcutId = '' } = body;
  const sourceOrderNum = parseInt(body.sourceOrderNum);
  const destinationOrderNum = parseInt(body.destinationOrderNum);
  let sql = '';
  if (sourceOrderNum < destinationOrderNum /* 下移 */) {
    sql = `UPDATE shortcut SET updated_at='${now}', order_num=order_num-1 WHERE uuid='${uuid}' AND order_num BETWEEN ${sourceOrderNum + 1} AND ${destinationOrderNum}`;
  } else {
    sql = `UPDATE shortcut SET updated_at='${now}', order_num=order_num+1 WHERE uuid='${uuid}' AND order_num BETWEEN ${destinationOrderNum} AND ${sourceOrderNum - 1}`;
  }
  const updateDragItemSql = `UPDATE shortcut SET order_num=${parseInt(destinationOrderNum)}  WHERE uuid='${uuid}' AND shortcut_id='${sourceShortcutId}'`;
  const results = await Promise.all([
    shortcutModel.execute(sql),
    shortcutModel.execute(updateDragItemSql),
  ]);
  if (results[0] && results[0][1] &&
    results[1] && results[1][1].affectedRows > 0) {
    ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
  } else {
    ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
  }
});

module.exports = router;
