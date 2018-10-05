const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const UserSchema = new mongoose.Schema({
  username: {type: String, lowercase: true, required: [true, "can't be blank"], match: [/^[a-zA-z0-9]+$/, 'is invalid'], index: true},
  email: {type: String, lowercase: true, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true},
  bio: String,
  image: String,
  hash: String,
  salt: String
}, {timestamp: true})

mongoose.model('User', UserSchema)
