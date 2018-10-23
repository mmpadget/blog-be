'use strict'

const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const secret = require('../config').secret

// Schema for the user model with validations
const UserSchema = new mongoose.Schema({
  username: {type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/^[a-zA-z0-9]+$/, 'is invalid'], index: true},
  email: {type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true},
  favorites: [{type: mongoose.Schema.Types.ObjectId, ref: 'Article'}],
  bio: String,
  image: String,
  hash: String,
  salt: String
}, {timestamps: true})

UserSchema.plugin(uniqueValidator, {message: 'is already taken.'})

// Method for setting User passwords
UserSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex')
  // Password to hash, the salt, the iteration (number of times to hash the password), the length (how long the hash should be), and the algorithm
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex')
}

// Method to validate passwords
UserSchema.methods.validPassword = function(password) {
  let hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex')
  return this.hash === hash
}

// A method on the user model to generate a JWT
UserSchema.methods.generateJWT = function() {
  let today = new Date()
  let exp = new Date(today)
  exp.setDate(today.getDate() + 60)

  return jwt.sign({
    id: this._id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000),
  }, secret)
}

// A method to get the JSON representation of a user for authentication
UserSchema.methods.toAuthJSON = function() {
  return {
    username: this.username,
    email: this.email,
    token: this.generateJWT(),
    bio: this.bio,
    image: this.image
  }
}

// A method that returns a user's public profile data with a user object parameter
UserSchema.methods.toProfileJSONFor = function(user) {
  return {
    username: this.username,
    bio: this.bio,
    image: this.image || 'https://api.adorable.io/avatars/144/adorable.png',
    following: false
  }
}

// A method for a user to favorite an article
UserSchema.methods.favorite = function(id) {
  if(this.favorites.indexOf(id) === -1) {
    this.favorites.push(id)
  }
  return this.save()
}

// A method for a user to unfavorite an article
UserSchema.methods.unfavorite = function(id) {
  this.favorites.remove(id)
  return this.save()
}

// A method for a user to check if they've favorited an article
UserSchema.methods.isFavorite = function(id) {
  return this.favorites.some(function(favoriteId) {
    return favoriteId.toString() === id.toString()
  })
}

mongoose.model('User', UserSchema)
