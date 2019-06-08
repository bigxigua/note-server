const router = require('koa-router')();
const { serializReuslt } = require('../util/serializable');
const fs = require('fs');
const path = require('path');
const { hostname, port } = require('../config/server-config');

function asyncFileWriteStreamClose(stream, fileName) {
    return new Promise((resolve) => {
        console.log(fileName);
        if (fileName === 'a5079ccb7578e4325435.jpg') {
            resolve(false);
            return;
        }
        stream.on('close', function (e) {
            resolve(true);
        });
        stream.on('error', function (e) {
            resolve(false);
            console.log(e, '-------error-------');
        });
    });
}

router.post('/uploadImage', async (ctx, next) => {
    const { files, body } = ctx.request;
    try {
        const { uuid, fileId } = body;
        const { file } = files;
        const filePath = path.join(__dirname, '../public/upload/') + `/${file.name}`;
        const fileReaderStream = fs.createReadStream(file.path);
        const fileWriteStream = fs.createWriteStream(filePath);
        fileReaderStream.pipe(fileWriteStream);
        const sign = await asyncFileWriteStreamClose(fileWriteStream, file.name);
        if (sign) {
            ctx.body = serializReuslt('SUCCESS', { path: `${hostname}:${port}/upload/${file.name}`, fileId });
        } else {
            ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
        }
    } catch (error) {
        console.log('-------上传文件出错--------', error);
        ctx.body = serializReuslt('SYSTEM_INNER_ERROR', error);
    }

});
module.exports = router;