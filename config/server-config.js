exports.JWT_KEY = 'TBZ_KEY';
exports.cookieConfig = {
    domain: '127.0.0.1',
    signed: true,
    path: '/',
    maxAge: 60 * 60 * 1000,
    httpOnly: false,
    overwrite: false
};