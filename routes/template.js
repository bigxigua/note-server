const router = require('koa-router')();
const CreateMysqlModel = require('../controller/sqlController');
const { serializReuslt, handleCustomError } = require('../util/serializable');
const { cookieConfig, hostname } = require('../config/server-config');
const fnv = require('fnv-plus');
const Pageres = require('pageres');
const path = require('path');
// const { getIn, isArray, log } = require('../util/util');
const templateModel = CreateMysqlModel('template');
const destDir = path.resolve(__dirname, '../../file-uploader/upload/file/images/');

// sizes参考https://github.com/kevva/viewport-list/blob/master/data.json
// pageres文档：https://github.com/sindresorhus/pageres
const pageresOptions = {
  delay: 0, // 延时多少秒开始截图
  crop: true, // 裁切到设定的高度
  cookies: [], // 转到要使用Cookie的网站，然后将其从DevTools复制粘贴。
  hide: ['.article-header', '.article-header_right', '.article-header_left', '.bookcatalog-wrapper'], // 隐藏与CSS选择器匹配的DOM元素数组。
};

/**
 * 创建一个文档
 * @param {string} html - 必选 html文本内容
 * @param {string} title - 可选 模版文档名称，默认为“模版文档”
 * @param {string} cover - 可选 预览的图片地址，默认会截图对应文档页
 * @param {string} url - 必选 被选作模版的文档地址
 */
router.post('/api/create/template', async (ctx) => {
  const { html, title, cover, url, uuid } = ctx.request.body;
  const now = Date.now().toString();
  const templateId = fnv.hash(`template-${uuid}-${now}`, 64).str();
  const token = ctx.cookies.get('token');
  try {
    pageresOptions.cookies[0] = `token=${token}; path=/; domain=${cookieConfig.domain}`;
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
      url: `${hostname}/file/images/${templateId}.png`,
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
    ctx.body = serializReuslt('SUCCESS', { templateId });
  } catch (error) {
    ctx.body = handleCustomError({ message: '生成模版预览图失败，请重试', error });
  }
});

module.exports = router;
