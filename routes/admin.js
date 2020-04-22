const router = require('koa-router')();
const fs = require('fs');
const path = require('path');
const { serializReuslt } = require('../util/serializable');

router.post('/api/ip', async (ctx) => {
  const { body: { ip } } = ctx.request;
  const configFileName = path.join(__dirname, '../upload') + `/config.json`;
  const configJson = await fs.readFileSync(configFileName, { encoding: 'utf-8' });
  const config = JSON.parse(configJson || '{}');
  const newIps = ip.split(',').filter(n => n);
  config.ips = [...new Set([].concat((config.ips || []), newIps))];
  await fs.writeFileSync(configFileName, JSON.stringify(config));
  ctx.body = serializReuslt('SUCCESS');
});

router.get('/api/ips', async (ctx) => {
  const { body: { ip } } = ctx.request;
  const configFileName = path.join(__dirname, '../upload') + `/config.json`;
  const configJson = await fs.readFileSync(configFileName, { encoding: 'utf-8' });
  const ips = JSON.parse(configJson || '{}').ips || [];
  ctx.body = serializReuslt('SUCCESS', { ips });
});

module.exports = router;