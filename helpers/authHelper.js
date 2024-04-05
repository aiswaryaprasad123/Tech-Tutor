
const { ObjectId } = require('mongodb')
const db = require('../db.js'); // Importing db connection


module.exports = {
    signup: (user, callback) => {
        db.get().collection('users').insertOne(user).then((data) => {
            console.log(data);
            callback(data.insertedId.toString());
        });
    },


    login: (email, password, callback) => {
        db.get().collection('users').findOne({ email, password }, (err, user) => {
          if (err) {
            console.log(err);
            callback(null);
          } else {
            callback(user);
          }
        });
      }
};



