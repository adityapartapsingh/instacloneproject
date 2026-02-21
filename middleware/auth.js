const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    try {
        const token = (req.cookies && req.cookies.token) || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
        if (!token) {
            return res.redirect('/auth/login');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Auth middleware error', err);
        if (res.clearCookie) res.clearCookie('token');
        return res.redirect('/auth/login');
    }
};