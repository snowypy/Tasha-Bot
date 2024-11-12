const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: DataTypes.STRING,
  content: DataTypes.TEXT,
  status: DataTypes.STRING,
  assignedTo: DataTypes.STRING,
  threadId: DataTypes.STRING
});

const StaffMember = sequelize.define('StaffMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  discordId: DataTypes.STRING,
  username: DataTypes.STRING,
  role: DataTypes.STRING
});

module.exports = { Ticket, StaffMember };
