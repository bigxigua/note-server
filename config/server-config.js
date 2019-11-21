const NODE_ENV = process.env.env;
const domain = NODE_ENV === 'production' ? '139.196.84.53' : '127.0.0.1';

exports.JWT_KEY = 'TBZ_KEY';

exports.cookieConfig = {
    domain,
    signed: true,
    path: '/',
    maxAge: 60 * 60 * 1000,
    httpOnly: false,
    overwrite: false
};

exports.hostname = `http://${domain}`;

exports.port = 8080;