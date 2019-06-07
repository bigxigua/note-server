const router = require('koa-router')();
const { serializReuslt } = require('../util/serializable');
const fs = require('fs');
const path = require('path');
const { hostname } = require('../config/server-config');

function asyncFileWriteStreamClose(stream) {
    return new Promise((resolve) => {
        stream.on('close', function (e) {
            console.log(e, '--------------');
            resolve(true);
        });
        stream.on('error', function (e) {
            resolve(false);
            console.log(e, '-------error-------');
        });
    });
}

router.post('/uploadImage', async (ctx, next) => {
    const { files, body = { uuid } } = ctx.request;
    try {
        const { file } = files;
        const filePath = path.join(__dirname, '../public/upload/') + `/${file.name}`;
        const fileReaderStream = fs.createReadStream(file.path);
        const fileWriteStream = fs.createWriteStream(filePath);
        fileReaderStream.pipe(fileWriteStream);
        const sign = await asyncFileWriteStreamClose(fileWriteStream);
        if (sign) {
            ctx.body = serializReuslt('SUCCESS', { path: `${hostname}/public/upload/${file.name}` });
        } else {
            ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
        }
    } catch (error) {
        ctx.body = serializReuslt('SYSTEM_INNER_ERROR', error);
    }

});
module.exports = router;