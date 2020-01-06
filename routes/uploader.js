const router = require('koa-router')();
const { serializReuslt } = require('../util/serializable');
const fs = require('fs');
const path = require('path');
const { hostname, port } = require('../config/server-config');
const SERVER_PATH = `${hostname}:${port}/img`;
// const UPLOAD_IMG_PATH = path.join(process.cwd(), './public/upload/');

function asyncFileWriteStreamClose(stream) {
    return new Promise((resolve) => {
        stream.on('close', function () {
            resolve(true);
        });
        stream.on('error', function (e) {
            resolve(false);
            console.log(e, '-------error-------');
        });
    });
};

router.post('/api/upload/image', async (ctx, next) => {
    const { files, body } = ctx.request;
    try {
        const { fileId } = body;
        const { file } = files;
        const fileReaderStream = fs.createReadStream(file.path);
        const filePath = path.join(__dirname, '../upload/') + `/${file.name}`;
        const fileWriteStream = fs.createWriteStream(filePath);
        fileReaderStream.pipe(fileWriteStream);
        const success = await asyncFileWriteStreamClose(fileWriteStream, file.name);
        if (success) {
            ctx.body = serializReuslt('SUCCESS', { path: `${SERVER_PATH}/${file.name}`, fileId });
        } else {
            ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
        }
    } catch (error) {
        console.log('-------上传文件出错--------', error);
        ctx.body = serializReuslt('SYSTEM_INNER_ERROR', error);
    }

});
module.exports = router;