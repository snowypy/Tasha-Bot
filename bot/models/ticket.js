const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Ticket = sequelize.define('Ticket', {
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'open'
  },
  messages: {
    type: DataTypes.JSON, // Array (author, content, timestamp)
    defaultValue: []
  }
});

module.exports = { Ticket };
