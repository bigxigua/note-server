const router = require('koa-router')();
const fnv = require('fnv-plus');
const notebookController = require('../controller/notebook');
const { serializReuslt } = require('../util/serializable');
const { isArray } = require('../util/util');
const NOTEBOOK_TABLE_NAME = 'note_notebook';
const SUB_NOTEBOOK_TABLE_NAME = 'note_subnote';

/**
 *  更新子笔记内容
 *  @html {string} 子笔记html文本
 *  @markdown {string} 子笔记arkdown文本
 *  @subNoteId {string} 子笔记本id
 *  @returns {object} 笔记数据
 */
router.post('/updateDraft', async (ctx, next) => {
    let { html, markdown, subNoteId } = ctx.request.body;
    markdown = markdown.replace(/'/img, "''");
    html = html.replace(/'/img, "''");
    const result = await notebookController.updateNotebook({
        sub_note_html: html,
        sub_note_markdown: markdown,
        sub_note_last_update: Date.now()
    }, `sub_note_id='${subNoteId}'`, SUB_NOTEBOOK_TABLE_NAME);
    if (result.changedRows > 0) {
        ctx.body = serializReuslt('SUCCESS', {});
    } else {
        ctx.body = serializReuslt('RESULE_DATA_NONE');
    }
});

/**
 *  createNotebook 创建新的笔记本
 *  @noteBookName {string} 笔记本名称
 *  @returns {object} 笔记数据
 */
router.post('/createNotebook', async (ctx, next) => {
    const { noteBookName, uuid } = ctx.request.body;
    const now = Date.now();
    let createResult = await notebookController.createNotebook({
        notebook_id: fnv.hash(noteBookName + uuid + now, 64).str(),
        user_id: uuid,
        notebook_created_time: now,
        notebook_last_update: now,
        notebook_name: noteBookName,
        note_exist: 1,
    }, NOTEBOOK_TABLE_NAME);
    if (createResult) {
        ctx.body = serializReuslt('SUCCESS', createResult);
    } else {
        ctx.body = serializReuslt('DATA_CREATE_FAILED');
    }
});

/**
 *  deleteNotebook 删除某个笔记本
 *  @noteBookId {string} 笔记本名称
 *  @returns {object} 笔记数据
 */
router.post('/deleteNotebook', async (ctx, next) => {
    const { noteBookId, hasSubNotes, uuid } = ctx.request.body;
    const querySql = `user_id='${uuid}' AND notebook_id='${noteBookId}' `;
    if (hasSubNotes) {
        // 如果有子笔记，需要删除所有子笔记(移动到废纸篓)
        const deleteResult = await notebookController.deleteNotebook(querySql, SUB_NOTEBOOK_TABLE_NAME);
        if (deleteResult.affectedRows > 0) {
            ctx.body = serializReuslt('SUCCESS', {});
        } else {
            ctx.body = serializReuslt('SUBNOTEBOOK_NOT_EXIT');
        }
    } else {
        const deleteResult = await notebookController.deleteNotebook(querySql, NOTEBOOK_TABLE_NAME);
        if (deleteResult.affectedRows > 0) {
            ctx.body = serializReuslt('SUCCESS', {});
        } else {
            ctx.body = serializReuslt('SUBNOTEBOOK_NOT_EXIT');
        }
    }
});

/**
 *  createSubNotebook 创建笔记本下的一个子笔记
 *  @notebookId {string} 所属笔记本id
 *  @subNoteTitle {string} 新的子笔记标题
 *  @returns {object} 笔记数据
 */
router.post('/createSubNotebook', async (ctx, next) => {
    const { notebookId, subNoteName = '笔记示例' } = ctx.request.body;
    const { uuid } = ctx.request.body;
    const now = Date.now();
    const noteBookInfo = await notebookController.findNoteBooks(`user_id='${uuid}' AND notebook_id='${notebookId}'`, NOTEBOOK_TABLE_NAME);
    if (!noteBookInfo) {
        ctx.body = serializReuslt('DATA_CREATE_FAILED');
        return;
    }
    let createResult = await notebookController.createNotebook({
        notebook_id: notebookId,
        user_id: uuid,
        sub_note_id: fnv.hash(notebookId + subNoteName + uuid + now, 64).str(),
        sub_note_created_time: now,
        sub_note_last_update: now,
        sub_note_name: subNoteName,
        sub_note_title: subNoteName,
        sub_note_html: '<p>这是一个新的笔记</p>↵',
        sub_note_markdown: '这是一个新的笔记',
        sub_note_exist: 1,
    }, SUB_NOTEBOOK_TABLE_NAME);
    if (createResult) {
        ctx.body = serializReuslt('SUCCESS', createResult);
    } else {
        ctx.body = serializReuslt('DATA_CREATE_FAILED');
    }
});

/**
 *  删除用户指定的子笔记
 *  @type {string} type. 0:真实删除 1:将该笔记状态sub_note_status置为0
 *  @subNoteId {string} subNoteId. 子笔记sub_note_id
 *  @returns {object} 笔记数据
 */
router.post('/deleteSubNote', async (ctx, next) => {
    let { type, subNoteId, uuid } = ctx.request.body;
    const querySql = `user_id='${uuid}' AND sub_note_id='${subNoteId}' AND sub_note_exist='${type}' `;
    const notes = await notebookController.findNoteBooks(querySql, SUB_NOTEBOOK_TABLE_NAME);
    if (isArray(notes)) {
        if (type === 0) {
            const deleteResult = await notebookController.deleteNotebook(querySql, SUB_NOTEBOOK_TABLE_NAME);
            if (deleteResult) {
                ctx.body = serializReuslt('SUCCESS', {});
            } else {
                ctx.body = serializReuslt('SYSTEM_INNER_ERROR');
            }
        } else {
            const result = await notebookController.updateNotebook({
                sub_note_exist: 0,
            }, querySql, SUB_NOTEBOOK_TABLE_NAME);
            if (result && result.changedRows > 0) {
                ctx.body = serializReuslt('SUCCESS', {});
            } else {
                ctx.body = serializReuslt('SUBNOTEBOOK_NOT_EXIT');
            }
        }
    } else {
        ctx.body = serializReuslt('SUBNOTEBOOK_NOT_EXIT');
    }
});

/**
 *  getUserNotes 查找用户的所有的笔记本
 *  @returns {null} 
 */
router.get('/getUserNotes', async (ctx, next) => {
    const { uuid } = ctx.request.body;
    // TODO 优化，只需要查SUB_NOTEBOOK_TABLE_NAME表，对数据进行处理即可
    let notebooks = await notebookController.findNoteBooks(`user_id='${uuid}'`, NOTEBOOK_TABLE_NAME);
    if (isArray(notebooks)) {
        const subNotes = await notebookController.findNoteBooks(`user_id='${uuid}'`, SUB_NOTEBOOK_TABLE_NAME);
        if (isArray(subNotes)) {
            notebooks = notebooks.map(notebook => {
                notebook.subNotes = [];
                subNotes.forEach(subnote => {
                    if (subnote.notebook_id === notebook.notebook_id) {
                        notebook.subNotes.push(subnote);
                    }
                });
                return notebook;
            });
        }
        ctx.body = serializReuslt('SUCCESS', notebooks);
    } else {
        // ctx.body = serializReuslt('USER_HAS_NOT_CREATED_NOTEBOOK');
        ctx.body = serializReuslt('SUCCESS', []);
    }
});

/**
 *  获取用户最近一次编辑的子笔记信息
 *  @returns {object} 子笔记数据
 */
router.get('/getRecentEditorSubnote', async (ctx, next) => {
    const { uuid } = ctx.request.body;
    let notes = await notebookController.findNoteBooks(`user_id='${uuid}' AND sub_note_exist=1 `, SUB_NOTEBOOK_TABLE_NAME);
    console.log(notes, '------');
    if (isArray(notes)) {
        notes = notes.sort((prev, next) => prev.sub_note_last_update <= next.sub_note_last_update);
        ctx.body = serializReuslt('SUCCESS', notes[0]);
    } else {
        ctx.body = serializReuslt('USER_HAS_NOT_CREATED_NOTEBOOK');
    }
});
/**
 *  更新子笔记信息
 *  更新sub_note_exist
 *  @subNoteId {string} subNoteId. 子笔记sub_note_id
 *  @returns {object} 子笔记数据
 */
router.post('/updateSubnoteInfo', async (ctx, next) => {
    const { uuid, subNoteId, subNoteExist } = ctx.request.body;
    let notes = await notebookController.findNoteBooks(`user_id='${uuid}' AND sub_note_id='${subNoteId}' `, SUB_NOTEBOOK_TABLE_NAME);
    if (isArray(notes)) {
        const params = {
            sub_note_last_update: Date.now(),
            sub_note_exist: subNoteExist,
        };
        const result = await notebookController.updateNotebook(params, `sub_note_id='${subNoteId}'`, SUB_NOTEBOOK_TABLE_NAME);
        if (result && result.changedRows > 0) {
            notes[0] = {
                ...notes[0],
                ...params
            };
            ctx.body = serializReuslt('SUCCESS', notes[0]);
        } else {
            ctx.body = serializReuslt('SUBNOTEBOOK_NOT_EXIT');
        }
    } else {
        ctx.body = serializReuslt('USER_HAS_NOT_CREATED_NOTEBOOK');
    }
});
/**
 *  根据子笔记名称搜索子笔记本
 *  更新sub_note_exist
 *  @subNoteId {string} subNoteId. 子笔记sub_note_id
 *  @returns {object} 子笔记数据
 */
router.get('/searchSubNote', async (ctx, next) => {
    const { uuid, subNoteName } = ctx.request.query;
    let notes = await notebookController.findNoteBooks(`user_id='${uuid}' AND sub_note_name LIKE '%${subNoteName}%' `, SUB_NOTEBOOK_TABLE_NAME);
    if (isArray(notes)) {
        ctx.body = serializReuslt('SUCCESS', notes);
    } else {
        ctx.body = serializReuslt('SUCCESS', []);
    }
});
module.exports = router;
