const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');

// create a sequelize instance with our local postgres database information.
const sequelize = new Sequelize('postgres', 'postgres', 'nitigya', {
    host: '127.0.0.1',
    dialect: 'postgres',
    pool: {
      max: 9,
      min: 0,
      idle: 10000
    }
  });

// setup User model and its fields.
const Token = sequelize.define('tokens', {
    name: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: false
    },
    username:{
        type: Sequelize.STRING,
        unique : false,
        allowNull: false
    },
    token: {
        type: Sequelize.STRING,
        unique : false,
        allowNull: false
    }
}, {
});

sequelize.sync()
    .then(() => console.log('tokens table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

module.exports = Token;