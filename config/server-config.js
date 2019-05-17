exports.JWT_KEY = 'TBZ_KEY';
const NODE_ENV = process.env.env;
exports.cookieConfig = {
    domain: NODE_ENV === 'production' ? '45.76.98.174' : '127.0.0.1',
    signed: true,
    path: '/',
    maxAge: 60 * 60 * 1000,
    httpOnly: false,
    overwrite: false
};