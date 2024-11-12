// auth.js
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const config = require('./config.js');

passport.use(new DiscordStrategy({
    clientID: config.discord.clientId,
    clientSecret: config.discord.clientSecret, 
    callbackURL: config.discord.callbackURL,
    scope: ['identify', 'guilds']
}, async (accessToken, refreshToken, profile, done) => {
    console.log('Discord strategy callback invoked for profile:', profile.username);
    const guild = profile.guilds.find(g => g.id === config.guildId);
    const isStaff = guild?.roles.some(r => config.staffRoleIds.includes(r));

    console.log(`User ${profile.username} guild roles checked. Is staff: ${isStaff}`);

    if (!isStaff) {
        console.log(`User ${profile.username} is not a staff member.`);
        return done(null, false);
    }

    console.log(`User ${profile.username} authenticated successfully.`);
    return done(null, {
        id: profile.id,
        username: profile.username,
        avatar: profile.avatar,
        accessToken
    });
}));