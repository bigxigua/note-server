"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const url_1 = require("url"); // eslint-disable-line node/no-deprecated-api
const p_memoize_1 = require("p-memoize");
const filenamify_1 = require("filenamify");
const unused_filename_1 = require("unused-filename");
const path = require("path");
const fs = require("fs");
const EventEmitter = require("events");
const arrayUniq = require("array-uniq");
const arrayDiffer = require("array-differ");
const dateFns = require("date-fns");
const getRes = require("get-res");
const logSymbols = require("log-symbols");
const makeDir = require("make-dir");
const captureWebsite = require("capture-website");
const viewportList = require("viewport-list");
const template = require("lodash.template");
const plur = require("plur");
// @ts-ignore
const filenamifyUrl = require("filenamify-url"); // TODO: Update filenamifyUrl and fix the import after https://github.com/sindresorhus/filenamify-url/issues/4 is resolved.
const writeFile = util_1.promisify(fs.writeFile);
const getResMem = p_memoize_1(getRes);
// @ts-ignore
const viewportListMem = p_memoize_1(viewportList);
class Pageres extends EventEmitter {
  constructor(options = {}) {
    super();
    // Prevent false-positive `MaxListenersExceededWarning` warnings
    this.setMaxListeners(Infinity);
    this.options = Object.assign({}, options);
    this.options.filename = this.options.filename || '<%= url %>-<%= size %><%= crop %>';
    this.options.format = this.options.format || 'png';
    this.options.incrementalName = this.options.incrementalName || false;
    this.stats = {};
    this.items = [];
    this.sizes = [];
    this.urls = [];
    this._source = [];
    this._destination = '';
  }
  src(url, sizes, options) {
    if (url === undefined) {
      return this._source;
    }
    if (!(typeof url === 'string' && url.length > 0)) {
      throw new TypeError('URL required');
    }
    if (!(Array.isArray(sizes) && sizes.length > 0)) {
      throw new TypeError('Sizes required');
    }
    this._source.push({ url, sizes, options });
    return this;
  }
  dest(directory) {
    if (directory === undefined) {
      return this._destination;
    }
    if (!(typeof directory === 'string' && directory.length > 0)) {
      throw new TypeError('Directory required');
    }
    this._destination = directory;
    return this;
  }
  async run() {
    await Promise.all(this.src().map(async (source) => {
      const options = Object.assign(Object.assign({}, this.options), source.options);
      const sizes = arrayUniq(source.sizes.filter(/./.test, /^\d{2,4}x\d{2,4}$/i));
      const keywords = arrayDiffer(source.sizes, sizes);
      this.urls.push(source.url);
      if (sizes.length === 0 && keywords.includes('w3counter')) {
        return this.resolution(source.url, options);
      }
      if (keywords.length > 0) {
        return this.viewport({ url: source.url, sizes, keywords }, options);
      }
      for (const size of sizes) {
        this.sizes.push(size);
        // TODO: Make this concurrent
        this.items.push(await this.create(source.url, size, options));
      }
      return undefined;
    }));
    this.stats.urls = arrayUniq(this.urls).length;
    this.stats.sizes = arrayUniq(this.sizes).length;
    this.stats.screenshots = this.items.length;
    if (!this.dest()) {
      return this.items;
    }
    await this.save(this.items);
    return this.items;
  }
  successMessage() {
    const { screenshots, sizes, urls } = this.stats;
    const words = {
      screenshots: plur('screenshot', screenshots),
      sizes: plur('size', sizes),
      urls: plur('url', urls)
    };
    console.log(`\n${logSymbols.success} Generated ${screenshots} ${words.screenshots} from ${urls} ${words.urls} and ${sizes} ${words.sizes}`);
  }
  async resolution(url, options) {
    for (const item of await getResMem()) {
      this.sizes.push(item.item);
      this.items.push(await this.create(url, item.item, options));
    }
  }
  async viewport(viewport, options) {
    for (const item of await viewportListMem(viewport.keywords)) {
      this.sizes.push(item.size);
      viewport.sizes.push(item.size);
    }
    for (const size of arrayUniq(viewport.sizes)) {
      this.items.push(await this.create(viewport.url, size, options));
    }
  }
  async save(screenshots) {
    await Promise.all(screenshots.map(async (screenshot) => {
      await makeDir(this.dest());
      const dest = path.join(this.dest(), screenshot.filename);
      await writeFile(dest, screenshot);
    }));
  }
  async create(url, size, options) {
    const basename = path.isAbsolute(url) ? path.basename(url) : url;
    let hash = url_1.parse(url).hash || '';
    // Strip empty hash fragments: `#` `#/` `#!/`
    if (/^#!?\/?$/.test(hash)) {
      hash = '';
    }
    const [width, height] = size.split('x');
    const filenameTemplate = template(`${options.filename}.${options.format}`);
    const now = Date.now();
    let filename = filenameTemplate({
      crop: options.crop ? '-cropped' : '',
      date: dateFns.format(now, 'yyyy-MM-dd'),
      time: dateFns.format(now, 'HH-mm-ss'),
      size,
      width,
      height,
      url: `${filenamifyUrl(basename)}${filenamify_1(hash)}`
    });
    if (options.incrementalName) {
      filename = unused_filename_1.sync(filename);
    }
    // TODO: Type this using the `capture-website` types
    const finalOptions = {
      width: Number(width),
      height: Number(height),
      delay: options.delay,
      timeout: options.timeout,
      fullPage: !options.crop,
      styles: options.css && [options.css],
      scripts: options.script && [options.script],
      cookies: options.cookies,
      element: options.selector,
      hideElements: options.hide,
      scaleFactor: options.scale === undefined ? 1 : options.scale,
      type: options.format === 'jpg' ? 'jpeg' : 'png',
      userAgent: options.userAgent,
      headers: options.headers,
      launchOptions: {
        args: [
          '--no-sandbox',
          // '--headless',
          // '--disable-gpu',
          // '--window-size=1920x1080'
        ]
      }
    };
    if (options.username && options.password) {
      finalOptions.authentication = {
        username: options.username,
        password: options.password
      };
    }
    const screenshot = await captureWebsite.buffer(url, finalOptions);
    screenshot.filename = filename;
    return screenshot;
  }
}
exports.default = Pageres;
// For CommonJS default export support
module.exports = Pageres;
module.exports.default = Pageres;
//# sourceMappingURL=index.js.map