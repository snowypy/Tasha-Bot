const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const config = require('../config.js');

passport.use(new DiscordStrategy({
    clientID: config.discord.clientId,
    clientSecret: config.discord.clientSecret, 
    callbackURL: config.discord.callbackURL,
    scope: ['identify', 'guilds']
}, async (accessToken, refreshToken, profile, done) => {
    const guild = profile.guilds.find(g => g.id === config.guildId);
    const isStaff = guild?.roles.some(r => config.staffRoleIds.includes(r));
    
    if (!isStaff) {
        return done(null, false);
    }
    
    return done(null, {
        id: profile.id,
        username: profile.username,
        avatar: profile.avatar,
        accessToken
    });
}));