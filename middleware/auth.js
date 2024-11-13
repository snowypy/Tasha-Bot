export const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isStaff) {
        return next();
    }
    req.session.destroy();
    res.redirect('/auth/discord');
};