const express = require('express');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const config = require('../../config.json');
const router = express.Router();

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new Strategy({
  clientID: config.CLIENT_ID,
  clientSecret: config.CLIENT_SECRET,
  callbackURL: 'http://dedi1.snowy.codes:25579/auth/callback',
  scope: ['identify']
}, (accessToken, refreshToken, profile, done) => {
  process.nextTick(() => done(null, profile));
}));

router.get('/login', passport.authenticate('discord'));
router.get('/auth/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/tickets');
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
