'use strict'

const router = require('express').Router()
const mongoose = require('mongoose')
const User = mongoose.model('User')
const auth = require('../auth')

// Prepopulate req.profile with the user's data when the :username parameter is contained within a route
router.param('username', function(req, res, next, username) {
  User.findOne({username: username}).then(function(user) {
    if(!user) {return res.sendStatus(404)} // Not found

    req.profile = user
    return next()
  }).catch(next)
})

// An endpoint to fetch a user's profile by their username
router.get('/:username', auth.optional, function(req, res, next) {
  if(req.payload) {
    User.findById(req.payload.id).then(function(user) {
      if(!user) {return res.json({profile: req.profile.toProfileJSONFor(false)})}

      // Pass along the relevant data into profile.toProfileJSONFor's user parameter
      return res.json({profile: req.profile.toProfileJSONFor(user)})
    })
  } else {
    return res.json({profile: req.profile.toProfileJSONFor(false)})
  }
})

// An endpoint for following another user
router.post('/:username/follow', auth.required, function(req, res, next) {
  let profileId = req.profile._id

  User.findById(req.payload.id).then(function(user) {
    if(!user) {return res.sendStatus(401)} // Unauthorized

    return user.follow(profileId).then(function() {
      return res.json({profile: req.profile.toProfileJSONFor(user)})
    })
  }).catch(next)
})

// An endpoint for unfollowing another user
router.delete('/:username/follow', auth.required, function(req, res, next) {
  let profileId = req.profile._id

  User.findById(req.payload.id).then(function(user) {
    if(!user) {return res.sendStatus(401)} // Unauthorized

    return user.unfollow(profileId).then(function() {
      return res.json({profile: req.profile.toProfileJSONFor(user)})
    })
  }).catch(next)
})

module.exports = router
