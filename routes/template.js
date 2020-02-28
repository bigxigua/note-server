const router = require('koa-router')();
const CreateMysqlModel = require('../controller/sqlController');
const { serializReuslt, handleCustomError } = require('../util/serializable');
const { hostname } = require('../config/server-config');
const fnv = require('fnv-plus');
const { getIn, isArray, log } = require('../util/util');
const templateModel = CreateMysqlModel('template');


/**
 * 创建一个文档
 * @param {string} html - 必选 html文本内容
 * @param {string} title - 可选 模版文档名称，默认为“模版文档”
 * @param {string} cover - 可选 预览的图片地址，默认会截图对应文档页
 * @param {string} url - 必选 被选作模版的文档地址
 */
router.post('/api/create/template', async (ctx) => {
  const { body } = ctx.request;
  const { html, title, cover, url, uuid } = body;
  const now = Date.now().toString();
  // TODO templateId如何保证唯一性
  const templateId = fnv.hash(`template-${uuid}-${now}`, 64).str();
  const [error, data] = await templateModel.create({
    template_id: templateId,
    created_at: now,
    updated_at: now,
    title,
    url,
    html,
    markdown: '',
    uuid,
    cover,
    status: '1',
  });
  if (error || !data) {
    ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
    return;
  }
  // 新增完之后更新space的catalog字段
  ctx.body = serializReuslt('SUCCESS', { templateId });
});

module.exports = router;
