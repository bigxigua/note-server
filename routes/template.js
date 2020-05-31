const router = require('koa-router')();
const CreateMysqlModel = require('../controller/sqlController');
const { serializReuslt, handleCustomError } = require('../util/serializable');
const { cookieConfig, isDevelopment } = require('../config/server-config');
const fnv = require('fnv-plus');
const Pageres = require('../util/pageres');
const path = require('path');
const { log, getIn } = require('../util/util');
const templateModel = CreateMysqlModel('template');
const docModel = CreateMysqlModel('doc');
const destDir = path.resolve(__dirname, '../../file-uploader/upload/file/images/');

// sizes参考https://github.com/kevva/viewport-list/blob/master/data.json
// pageres文档：https://github.com/sindresorhus/pageres
const pageresOptions = {
  delay: 0, // 延时多少秒开始截图
  crop: true, // 裁切到设定的高度
  cookies: [], // 转到要使用Cookie的网站，然后将其从DevTools复制粘贴。
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.100 Safari/537.36', // Custom user agent
  hide: ['.article-header_right'], // 隐藏与CSS选择器匹配的DOM元素数组。
};

/**
 * 将西瓜文档设置为模版
 * @param {string} docId - 必须 被设置为模版的文档Id
 */
router.post('/api/create/template', async (ctx) => {
  const { docId, uuid } = ctx.request.body;
  const now = Date.now().toString();
  const templateId = fnv.hash(`template-${uuid}-${now}`, 64).str();
  const token = ctx.cookies.get('token');
  const hostname = isDevelopment ? 'http://127.0.0.1:3000' : 'https://www.bigxigua.net';
  // 查询文档信息
  const [, docInfos] = await docModel.find(`uuid='${uuid}' AND doc_id='${docId}'`);
  const docInfo = getIn(docInfos, ['0']);
  // 文档不存在
  if (!docInfo) {
    return ctx.body = handleCustomError({ message: '当前文档不存在' });
  }
  const { is_template, title, html, url } = docInfo;
  // 已是模版
  if (is_template === '1') {
    return ctx.body = handleCustomError({ message: '当前文档已是模版' });
  }
  // 设置当前文档的is_template属性为1
  const [error, data] = await docModel.update({ is_template: '1' }, `uuid='${uuid}' AND doc_id='${docId}'`);

  if (error || !data) {
    return ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
  }
  try {
    pageresOptions.cookies[0] = {
      name: 'token',
      value: token,
      domain: `${isDevelopment ? '' : '.'}${cookieConfig.domain}`,
      path: '/',
      httpOnly: true
    };
    pageresOptions.filename = templateId;
    await new Pageres(pageresOptions)
      .src(url, ['800x1280'])
      .dest(destDir)
      .run();
    const [error, data] = await templateModel.create({
      template_id: templateId,
      created_at: now,
      updated_at: now,
      title,
      url,
      html,
      doc_id: docId,
      markdown: '',
      uuid,
      cover: `${hostname}/file/images/${templateId}.png`,
      status: '1',
    });
    if (error || !data) {
      ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
      return;
    }
    ctx.body = serializReuslt('SUCCESS', { templateId });
  } catch (error) {
    ctx.body = handleCustomError({ message: '生成模版预览图失败，请重试', data: error });
    console.log('生成模版预览图失败:', error);
  }
});

/**
 * 获取用户所有模版信息
 * @param {string} uuid - 必选 用户uuid
 */
router.post('/api/templates', async (ctx) => {
  const { query: { uuid } } = ctx.request;
  const [error, data] = await templateModel.find(`uuid='${uuid}' ORDER BY id DESC`);
  if (error || !Array.isArray(data)) {
    ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
    return;
  }
  ctx.body = serializReuslt('SUCCESS', data);
});

/**
 * 根据模版id删除模版
 * @param {string} templateId - 必选 模版id
 */
router.post('/api/delete/template', async (ctx) => {
  const { body: { uuid, templateId } } = ctx.request;
  const findTemplateSql = `uuid='${uuid}' AND template_id='${templateId}'`;
  const [, templateInfo] = await templateModel.find(findTemplateSql);
  const [error, data] = await templateModel.delete(findTemplateSql);
  const docId = getIn(templateInfo, ['0', 'doc_id']);
  if (!error && data && data.affectedRows > 0) {
    await templateModel.find(findTemplateSql);
    try {
      if (docId) {
        await docModel.update({ is_template: '0' }, `uuid='${uuid}' AND doc_id='${docId}'`);
      }
    } catch (error) {
      global.logger.error(`/api/delete/template/：UUID:${uuid};URL:/api/delete/template;code: SET_DOC_IS_TEMPLATE_FAIL`);
    } finally {
      ctx.body = serializReuslt('SUCCESS', { STATUS: 'OK' });
    }
    return;
  }
  ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
});

module.exports = router;
