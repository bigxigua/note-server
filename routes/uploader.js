const router = require('koa-router')();
const { serializReuslt } = require('../util/serializable');
const fs = require('fs');
const path = require('path');
const { hostname, port } = require('../config/server-config');
const SERVER_PATH = `${hostname}:${port}/img`;
const UPLOAD_IMG_PATH = path.join(process.cwd(), '../note-static/img');

function asyncFileWriteStreamClose(stream, fileName) {
    return new Promise((resolve) => {
        console.log(fileName);
        if (fileName === 'avatar_user.jpg') {
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
};

router.post('/uploadImage', async (ctx, next) => {
    const { files, body } = ctx.request;
    try {
        const { uuid, fileId } = body;
        const { file } = files;
        const fileReaderStream = fs.createReadStream(file.path);
        const fileWriteStream = fs.createWriteStream(UPLOAD_IMG_PATH);
        fileReaderStream.pipe(fileWriteStream);
        const sign = await asyncFileWriteStreamClose(fileWriteStream, file.name);
        if (sign) {
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