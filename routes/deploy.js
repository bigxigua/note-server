const router = require('koa-router')();
const { serializReuslt } = require('../util/serializable');
const fs = require('fs');
const path = require('path');
const execa = require('execa');


router.post('/api/deploy/note-server', async (ctx, next) => {
  console.log('-----process.cwd----', process.cwd());
});
module.exports = router;