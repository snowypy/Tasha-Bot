// auth.js
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
import config from './config.js';

passport.use(new DiscordStrategy({
    clientID: config.discord.clientId,
    clientSecret: config.discord.clientSecret,
    callbackURL: config.discord.callbackURL,
    scope: ['identify', 'guilds', 'guilds.members.read'] // Added required scopes
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Auth debug - Profile:', {
            id: profile.id,
            username: profile.username,
            guilds: profile.guilds?.map(g => g.id)
        });

        // Find guild in user's guilds
        const guild = profile.guilds?.find(g => g.id === config.discord.guildId);
        
        if (!guild) {
            console.log(`User ${profile.username} guild check failed. User's guilds:`, profile.guilds?.map(g => g.id));
            console.log('Expected guild:', config.discord.guildId);
            return done(null, false);
        }

        // Check for staff role - bitwise check for ADMINISTRATOR or specified role
        const hasAdmin = (BigInt(guild.permissions) & BigInt(0x8)) !== BigInt(0);
        
        console.log('Auth debug - Permissions:', {
            userId: profile.id,
            guildId: guild.id,
            permissions: guild.permissions,
            hasAdmin
        });

        const user = {
            id: profile.id,
            username: profile.username,
            avatar: profile.avatar,
            isStaff: hasAdmin,
            accessToken
        };

        if (!hasAdmin) {
            console.log(`User ${profile.username} lacks staff permissions`);
            return done(null, false);
        }

        console.log(`User ${profile.username} authenticated successfully as staff`);
        return done(null, user);

    } catch (err) {
        console.error('Auth error:', err);
        return done(err, false);
    }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));