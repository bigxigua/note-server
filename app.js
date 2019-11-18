const Koa = require('koa');
const app = new Koa();
const views = require('koa-views');
const json = require('koa-json');
const onerror = require('koa-onerror');
const koaBody = require('koa-body');
const logger = require('koa-logger');
const cors = require('koa-cors');
const updateDraft = require('./routes/updateDraft');
const login = require('./routes/login');
const register = require('./routes/register');
const uploader = require('./routes/uploader');
const userDocActions = require('./routes/doc');
const space = require('./routes/space');
const verify = require('./middleware/verify');

// error handler
onerror(app);

// middlewares
app.use(koaBody({
  multipart: true,
  json: true,
}));
app.use(json());
app.use(logger());
app.use(cors({
  credentials: true,
  formidable: {
    maxFileSize: 200*1024*1024,
  },
}));
app.use(verify());
app.use(require('koa-static')(__dirname + '/public'));
app.use(require('koa-static')(__dirname + '/views'));

app.use(views(__dirname + '/views', {
  extension: 'html'
}));

app.keys = ['fuckme'];
// logger
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
});

// routes
app.use(login.routes(), login.allowedMethods());
app.use(register.routes(), register.allowedMethods());
app.use(uploader.routes(), uploader.allowedMethods());
app.use(updateDraft.routes(), updateDraft.allowedMethods());
app.use(userDocActions.routes(), userDocActions.allowedMethods());
app.use(space.routes(), space.allowedMethods());

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app;
