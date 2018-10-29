'use strict'

const router = require('express').Router()
const mongoose = require('mongoose')
const Article = mongoose.model('Article')

// A route for getting the set of tags that have been used on articles
router.get('/', function(req, res, next) {
  Article.find().distinct('tagList').then(function(tags) {
    return res.json({tags: tags})
  }).catch(next)
})

module.exports = router
