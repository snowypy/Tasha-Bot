export const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isStaff) {
        return next();
    }
    // Clear any existing session
    req.session.destroy();
    res.redirect('/auth/discord');
};