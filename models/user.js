const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String, 
        required: true,
        unique: true
    }
});

userSchema.plugin(passportLocalMongoose); // Add on username, password.

module.exports = mongoose.model('User', userSchema); 