const mongoose = require('mongoose');

const state = {
    db: null
};

module.exports.connect = function (done) {
    const url = 'mongodb://localhost:27017';
    const dbname = 'techtutor';

    mongoose.connect(`${url}/${dbname}`);

    const db = mongoose.connection;

    db.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        done(err);
    });

    db.once('open', () => {
        console.log('MongoDB connected successfully');
        state.db = db;
        done();
    });
};

module.exports.get = function () {
    return state.db;
};
