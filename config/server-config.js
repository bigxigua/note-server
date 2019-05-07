exports.JWT_KEY = 'TBZ_KEY';
exports.cookieConfig = {
    domain: 'localhost',
    signed: true,
    path: '/',
    maxAge: 10 * 60 * 1000,
    expires: new Date('2019-08-01'),
    httpOnly: false,
    overwrite: false
};