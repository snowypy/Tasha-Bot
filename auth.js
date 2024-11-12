const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const config = require('./config.js');

passport.use(new DiscordStrategy({
    clientID: config.discord.clientId,
    clientSecret: config.discord.clientSecret,
    callbackURL: config.discord.callbackURL,
    scope: ['identify', 'guilds.members.read']  // Add guilds.members.read scope
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user has the staff role directly from profile
        const guild = profile.guilds?.find(g => g.id === config.discord.guildId);
        if (!guild) {
            console.log('User not in required guild');
            return done(null, false);
        }

        // Convert guild.roles to number for bitwise check
        const hasStaffRole = (BigInt(guild.permissions) & BigInt(0x8)) !== BigInt(0);
        
        if (!hasStaffRole) {
            console.log('User lacks staff role');
            return done(null, false);
        }

        return done(null, {
            id: profile.id,
            username: profile.username,
            avatar: profile.avatar,
            isStaff: true
        });
    } catch (err) {
        console.error('Auth error:', err);
        return done(err, false);
    }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));