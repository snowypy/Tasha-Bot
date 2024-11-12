// middleware/auth.js
const isAuthenticated = (req, res, next) => {
    console.log('Authentication check for request. User authenticated:', req.isAuthenticated());
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/discord');
};

module.exports = { isAuthenticated };