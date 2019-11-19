const router = require('koa-router')();
const spaceController = require('../controller/space');
const { serializReuslt } = require('../util/serializable');
const fnv = require('fnv-plus');

/**
 * 创建一个空间
 */
router.post('/create/space', async (ctx) => {
  const { body } = ctx.request;
  const { description, name, scene, public, uuid } = body;
  const now = new Date(Date.now());
  const spaceId = fnv.hash(`${uuid}-${now}-${name}`, 64).str();
  const [error, data] = await spaceController.createSpace({
    created_at: now,
    updated_at: now,
    content_updated_at: now,
    description,
    name,
    scene,
    uuid,
    public,
    space_id: spaceId
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
  const [error, data] = await spaceController.findSpace(`uuid='${uuid}' ${q ? `AND name LIKE '%${q}%'` : ''}limit ${limit}`);
	if (error || !Array.isArray(data)) {
		ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
		return;
	}
	ctx.body = serializReuslt('SUCCESS', {
		spaces: data
	});
});

module.exports = router;
