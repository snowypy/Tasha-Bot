const express = require('express');
const app = express();
const { Client, GatewayIntentBits } = require('discord.js');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const sequelize = require('./bot/models/db');

const bot = require('./bot/bot');
const authRoutes = require('./panel/routes/auth');
const ticketRoutes = require('./panel/routes/tickets');

sequelize.sync()
  .then(() => {
    console.log('Database synchronized');
  })
  .catch((error) => {
    console.error('Error syncing database:', error);
  });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'panel', 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ 
  secret: 'supersecret', 
  resave: false, 
  saveUninitialized: false 
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', authRoutes);
app.use('/tickets', ticketRoutes);

const server = http.createServer(app);
const io = socketIo(server);
bot.startBot(io);

server.listen(25579, () => {
  console.log('Web server running on port 25579');
});
