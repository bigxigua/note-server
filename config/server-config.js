const NODE_ENV = process.env.env;
const domain = NODE_ENV === 'development' ? '127.0.0.1' : 'www.bigxigua.net';

exports.JWT_KEY = 'TBZ_KEY';

exports.PASSWORD_FNV_SALT = 'TBZ_IS_BEST_MAN_BUT_HI_IS_HAHHAHAH';

exports.cookieConfig = {
    domain,
    signed: true,
    path: '/',
    maxAge: 60 * 60 * 1000,
    httpOnly: false,
    overwrite: false
};

exports.hostname = NODE_ENV === 'development' ? 'http://127.0.0.1:3004' : 'https://bigxigua.net';

exports.port = 8080;