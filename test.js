// const Pageres = require('pageres');
// const path = require('path');
// const hostname = 'http://127.0.0.1:3004/article/2cu4loycwrzct?spaceId=2gjn01lb4pf1m';
// const destDir = path.resolve(__dirname, '../file-uploader/upload/file/images/')
// const options = {
//   delay: 0, // 延时多少秒开始截图
//   crop: true, // 裁切到设定的高度
//   incrementalName: true, // 当文件存在时，追加一个增量编号。
//   userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.100 Safari/537.36', // Custom user agent
//   hide: ['.article-header', '.bookcatalog-wrapper'], // 隐藏与CSS选择器匹配的DOM元素数组。
// };

// (async () => {
//   try {
//     await new Pageres(options)
//       .src('https://www.bigxigua.net/', ['800x1280'])
//       .dest('./fuck.png')
//       .run();
//     console.log('截图成功');
//   } catch (error) {
//     console.log('----------');
//     console.log(error);
//     process.exit();
//   }
// })();