const router = require('koa-router')();
const fnv = require('fnv-plus');
const notebookController = require('../controller/notebook');
const { serializReuslt } = require('../util/serializable');
const { isArray } = require('../util/util');

/**
 *  更新子笔记内容
 *  @html {string} 子笔记html文本
 *  @markdown {string} 子笔记arkdown文本
 *  @subNoteId {string} 子笔记本id
 *  @returns {object} 笔记数据
 */
router.post('/updateDraft', async (ctx, next) => {
    let { html, markdown, subNoteId } = ctx.request.body;
    const result = await notebookController.updateNotebook({
        sub_note_html: html,
        sub_note_markdown: markdown,
    }, `sub_note_id='${subNoteId}'`);
    if (result.changedRows > 0) {
        ctx.body = serializReuslt('SUCCESS', {});
    } else {
        ctx.body = serializReuslt('RESULE_DATA_NONE');
    }
});

/**
 * createNotebook 创建新的笔记本
 *  @noteBookName {string} 笔记本名称
 *  @isCreateSubNote {boolean} 是否是新建子笔记
 *  @subNoteTitle {string} 子笔记本标题
 *  @returns {object} 笔记数据
 */
router.post('/createNotebook', async (ctx, next) => {
    const { noteBookName, isCreateSubNote, subNoteTitle = '笔记示例' } = ctx.request.body;
    const { uuid } = ctx.request.body;
    // 创建新的笔记本时会新建一个新的笔记条目
    const now = Date.now();
    let createResult;
    let columns = {
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
    }
    if (isCreateSubNote) {
        // 正在创建子笔记
        createResult = await notebookController.createNotebook({
            ...columns,
            is_notebook: 0
        });
    } else {
        // 正在创建笔记本
        createResult = await notebookController.createNotebook(columns);
    }
    if (createResult) {
        ctx.body = serializReuslt('SUCCESS', createResult);
    } else {
        ctx.body = serializReuslt('DATA_CREATE_FAILED');
    }
});

/**
 * createNotebook 查找用户的所有的笔记本
 */
router.get('/getUserNotes', async (ctx, next) => {
    // TODO 区分废纸篓
    const { uuid } = ctx.request.body;
    const notes = await notebookController.findNoteBooks(`user_id='${uuid}' AND is_notebook=1`);
    // TODO 在查询所有笔记本下属的子笔记
    if (isArray(notes)) {
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
});
/**
 *  删除用户指定的子笔记
 *  @type {string} type. 0:真实删除 1:将该笔记状态sub_note_status置为0
 *  @subNoteId {string} subNoteId. 子笔记sub_note_id
 *  @returns {object} 笔记数据
 */
router.post('/deleteSubNote', async (ctx, next) => {
    let { type, subNoteId, uuid } = ctx.request.body;
    const querySql = `user_id='${uuid}' AND sub_note_id='${subNoteId}' AND sub_note_exist=1 `;
    const notes = await notebookController.findNoteBooks(querySql);
    console.log(notes);
    if (isArray(notes)) {
        if (type === 0) {
        } else {
            const result = await notebookController.updateNotebook({
                sub_note_exist: 0,
            }, querySql);
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
module.exports = router;
