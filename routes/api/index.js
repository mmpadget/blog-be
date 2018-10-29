'use strict'

const router = require('express').Router()

// Register the users router with the API router
router.use('/', require('./users'))

// Register the profiles router with the API router
router.use('/profiles', require('./profiles'))

// Register the articles router with the API router
router.use('/articles', require('./articles'))

// Register the tags router with the API router
router.use('/tags', require('./tags'))

// Function for our API router to handle validation errors from Mongoose
router.use(function(err, req, res, next) {
  if(err.name === 'ValidationError') {
    // Unprocessable entity
    return res.status(422).json({
      errors: Object.keys(err.errors).reduce(function(errors, key) {
        errors[key] = err.errors[key].message
        return errors
      }, {})
    })
  }
  return next(err)
})

module.exports = router
