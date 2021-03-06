'use strict'

const mongoose = require('mongoose')
const router = require('express').Router()
const passport = require('passport')
const User = mongoose.model('User')
const auth = require('../auth')

// User registration route
router.post('/users', function(req, res, next) {
  let user = new User()

  user.username = req.body.user.username
  user.email = req.body.user.email
  user.setPassword(req.body.user.password)

  user.save().then(function() {
    return res.json({user: user.toAuthJSON()})
  }).catch(next)
})

// User login route. 500 internal server error is the default server response. 422 unprocessable entity if email or password not provided.
router.post('/users/login', function(req, res, next) {
  if(!req.body.user.email) {
    // Unprocessable entity
    return res.status(422).json({errors: {email: "can't be blank"}})
  }

  if(!req.body.user.password) {
    // Unprocessable entity
    return res.status(422).json({errors: {password: "can't be blank"}})
  }

  passport.authenticate('local', {session: false}, function(err, user, info) {
    if(err) {return next(err)}

    if(user) {
      user.token = user.generateJWT()
      return res.json({user: user.toAuthJSON()})
    } else {
      // Unprocessable entity
      return res.status(422).json(info)
    }
  })(req, res, next)
})

// Endpoint to get the current user's auth payload from their token. 401 unauthorized. If JWT of user removed from the database.
router.get('/user', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user) {
    if(!user) {return res.sendStatus(401)} // Unauthorized
    
    return res.json({user: user.toAuthJSON()})
  }).catch(next)
})

// Update users endpoint
router.put('/user', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user) {
    if(!user) {return res.sendStatus(401)} // Unauthorized

    // Only set fields on the user that were passed by the front-end
    if(typeof req.body.user.username !== 'undefined') {
      user.username = req.body.user.username
    }

    if(typeof req.body.user.email !== 'undefined') {
      user.email = req.body.user.email
    }

    if(typeof req.body.user.bio !== 'undefined') {
      user.bio = req.body.user.bio
    }

    if(typeof req.body.user.image !== 'undefined') {
      user.image = req.body.user.image
    }

    if(typeof req.body.user.password !== 'undefined') {
      user.setPassword(req.body.user.password)
    }
    return user.save().then(function() {
      return res.json({user: user.toAuthJSON()})
    })
  }).catch(next)
})

module.exports = router
