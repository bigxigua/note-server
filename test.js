const Pageres = require('pageres');
const path = require('path');
const hostname = 'http://127.0.0.1:3004/article/2cu4loycwrzct?spaceId=2gjn01lb4pf1m';
const destDir = path.resolve(__dirname, '../file-uploader/upload/file/images/')
const options = {
  delay: 0, // 延时多少秒开始截图
  crop: true, // 裁切到设定的高度
  css: '.article-html{ font-size: 14px; }', // 将自定义CSS应用于网页。指定一些CSS或CSS文件的路径
  script: '', // 将自定义JavaScript应用于网页。指定一些JavaScript或文件的路径。
  cookies: [
    'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiM2ppZ2gwaXdlZ2ZsciIsInVzZXJMb2dpblZlcnNpb24iOiIxNTgyOTY5NjYzMDQ0IiwiZXhwIjoxNTg1NTY2ODIyLCJpYXQiOjE1ODI5NzQ4MjJ9.cZw7EyH9BIqN0gKhHgilIzYzweXpvrIF5bd2MMnxLsw; path=/; domain=127.0.0.1',
  ], // 转到要使用Cookie的网站，然后将其从DevTools复制粘贴。
  filename: '<%= date %> - <%= url %>-<%= size %>', // 使用定义自定义文件名
  incrementalName: true, // 当文件存在时，追加一个增量编号。
  selector: '', // 捕获与CSS选择器匹配的特定DOM元素。
  hide: ['.article-header', '.bookcatalog-wrapper'], // 隐藏与CSS选择器匹配的DOM元素数组。
};

(async () => {
  try {
    await new Pageres(options)
      .src(hostname, ['800x1280'])
      // .src('data:text/html;charset=utf-8,<h2 id="fYLNMZoX5x">会议信息</h2><p>名称：XX</p><p>主题：XX</p><p>时间：XXXX-XX-XX</p><p>地点：XX</p><p>主持人：XX</p><p>参会人员：XX</p><h2 id="V8CgWZCayZ">会议结论</h2><p>xx地区本月降雨量</p><p>季节因素影响</p><p>人员安排</p><h2 id="ObYNhcdXMW">待办事项</h2><p>仙器房提取仙器-雷公，1月2号</p><p>雨师调查xx地区凡人耕作情况</p><p>... ...</p>', ['iphone 5s'])
      .dest(destDir)
      .run();
    console.log('截图成功');
  } catch (error) {
    console.log('----------');
    console.log(error);
    process.exit();
  }
})();