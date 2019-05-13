const router = require('koa-router')();
const jwt = require('jsonwebtoken');
const fnv = require('fnv-plus');
const userController = require('../controller/user');
const notebookController = require('../controller/notebook');
const { serializReuslt } = require('../util/serializable');
const { JWT_KEY } = require('../config/server-config');
/**
 * login 路由
 *  1. 用户身份有效性验证
 *  2. 更新笔记表的数据
 *  3. 更新用户表的notebooks
 */
router.post('/updateDraft', async (ctx, next) => {
    let token = ctx.cookies.get('token');
    let { html, markdown, subNoteId } = ctx.request.body;
    if (!token) {
        ctx.body = serializReuslt('USER_NOT_LOGGED_IN');
        return;
    }
    let { uuid } = jwt.verify(token, JWT_KEY) || {};
    if (uuid) {
        const result = await notebookController.updateNotebook({
            sub_note_html: html,
            sub_note_markdown: markdown,
        }, `sub_note_id='${subNoteId}'`);
        if (result.changedRows > 0) {
            ctx.body = serializReuslt('SUCCESS', {});
        } else {
            ctx.body = serializReuslt('RESULE_DATA_NONE');
        }
    } else {
        ctx.body = serializReuslt('USER_NOT_EXIST');
    }
});

/**
 * createNotebook 创建新的笔记本
 */
router.post('/createNotebook', async (ctx, next) => {
    let token = ctx.cookies.get('token');
    let { noteBookName } = ctx.request.body;
    if (!token) {
        ctx.body = serializReuslt('USER_NOT_LOGGED_IN');
        return;
    }
    let { uuid } = jwt.verify(token, JWT_KEY) || {};
    if (uuid) {
        // 创建新的笔记本时会新建一个新的笔记条目
        const now = Date.now();
        const subNoteTitle = '笔记示例';
        const createResult = await notebookController.createNotebook({
            notebook_id: fnv.hash(noteBookName + uuid + now, 64).str(),
            notebook_name: noteBookName,
            is_notebook: 1,
            user_id: uuid,
            note_created_time: now,
            sub_note_html: '<p>这是一个新的笔记</p>↵',
            sub_note_markdown: '这是一个新的笔记',
            sub_note_title: subNoteTitle,
            sub_note_id: fnv.hash(noteBookName + subNoteTitle + uuid + now, 64).str(),
            sub_note_created_time: now,
        });
        if (createResult) {
            ctx.body = serializReuslt('SUCCESS', createResult);
        } else {
            ctx.body = serializReuslt('DATA_CREATE_FAILED');
        }
    } else {
        ctx.body = serializReuslt('USER_NOT_EXIST');
    }
});

/**
 * createNotebook 查找用户的所有的笔记本
 */
router.get('/getUserNotes', async (ctx, next) => {
    // TODO 区分废纸篓
    let token = ctx.cookies.get('token');
    if (!token) {
        ctx.body = serializReuslt('USER_NOT_LOGGED_IN');
        return;
    }
    let { uuid } = jwt.verify(token, JWT_KEY) || {};
    if (uuid) {
        const notes = await notebookController.findNoteBooks(`user_id='${uuid}' AND is_notebook=1`);
        // TODO 在查询所有笔记本下属的子笔记
        if (Array.isArray(notes) && notes.length > 0) {
            const getsubNotes = notes.map((note) => {
                return new Promise(async (resolve) => {
                    note.subNotes = await notebookController.findNoteBooks(`user_id='${uuid}' AND notebook_name='${note.notebook_name}' `);
                    resolve();
                })
            });
            await Promise.all(getsubNotes);
            ctx.body = serializReuslt('SUCCESS', notes);
        } else {
            ctx.body = serializReuslt('USER_HAS_NOT_CREATED_NOTEBOOK', notes);
        }
    } else {
        ctx.body = serializReuslt('USER_NOT_EXIST');
    }
});

module.exports = router;
