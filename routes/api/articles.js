'use strict'

const router = require('express').Router()
const passport = require('passport')
const mongoose = require('mongoose')
const Article = mongoose.model('Article')
const Comment = mongoose.model('Comment')
const User = mongoose.model('User')
const auth = require('../auth')

// Endpoint to list all articles
router.get('/', auth.optional, function(req, res, next) {
 let query = {}
 let limit = 20
 let offset = 0

 if(typeof req.query.limit !== 'undefined') {
   limit = req.query.limit
 }

 if(typeof req.query.offset !== 'undefined') {
   offset = req.query.offset
 }

 if(typeof req.query.tag !== 'undefined') {
   query.tagList = {"$in" : [req.query.tag]}
 }

 return Promise.all([
   Article.find(query)
    .limit(Number(limit))
    .skip(Number(offset))
    .sort({createdAt: 'desc'})
    .populate('author')
    .exec(),
  Article.count(query).exec(),
  req.payload ? User.findById(req.payload.id) : null,
]).then(function(results) {
    let articles = results[0]
    let articlesCount = results[1]
    let user = results[2]

    return res.json({
      articles: articles.map(function(article) {
        return article.toJSONFor(user)
      }),
      articlesCount: articlesCount
    })
  }).catch(next)
})

// Endpoint for creating articles
router.post('/', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user) {
    if(!user) {return res.sendStatus(404)} // Not found

    let article = new Article(req.body.article)

    article.author = user
    return article.save().then(function() {
      console.log(article.author)
      return res.json({article: article.toJSONFor(user)})
    })
  }).catch(next)
})

// Endpoint for favoriting an article
router.post('/:article/favorite', auth.required, function(req, res, next) {
  let articleId = req.article._id

  User.findById(req.payload.id).then(function(user) {
    if(!user) {return res.sendStatus(401)} // Unauthorized

    return user.favorite(articleId).then(function() {
      return req.article.updateFavoriteCount().then(function(article) {
        return res.json({article: article.toJSONFor(user)})
      })
    })
  })
})

// Endpoint for unfavoriting an article
router.delete('/:article/favorite', auth.required, function(req, res, next) {
  let articleId = req.article._id

  User.findById(req.payload.id).then(function(user) {
    if(!user) {return res.sendStatus(401)} // Unauthorized
    return user.unfavorite(articleId).then(function() {
      return req.article.updateFavoriteCount().then(function(article) {
        return res.json({article: article.toJSONFor(user)})
      })
    })
  }).catch(next)
})

// Intercept and prepopulate article data from the slug
router.param('article', function(req, res, next, slug) {
  Article.findOne({slug: slug})
    .populate('author')
    .then(function(article) {
      if(!article) {return res.sendStatus(404)} // Not found
      req.article = article
      return next()
    }).catch(next)
})

// Read endpoint for retrieving an article by its slug
router.get('/:article', auth.optional, function(req, res, next) {
  Promise.all([
    req.payload ? User.findById(req.payload.id) : null,
    req.article.populate('author').execPopulate()
  ]).then(function(results) {
    let user = results[0]
    return res.json({article: req.article.toJSONFor(user)})
  }).catch(next)
})

// Endpoint for updating articles
router.put('/:article', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user) {
    if(req.article.author._id.toString() === req.payload.id.toString()) {
      if(typeof req.body.article.title !== 'undefined') {
        req.article.title = req.body.article.title
      }

      if(typeof req.body.article.description !== 'undefined') {
        req.article.description = req.body.article.description
      }

      if(typeof req.body.article.body !== 'undefined') {
        req.article.body = req.body.article.body
      }

      req.article.save().then(function(article) {
        return res.json({article: article.toJSONFor(user)})
      }).catch(next)
    } else {
      return res.sendStatus(403) // Forbidden
    }
  })
})

// Endpoint for deleting articles
router.delete('/:article', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function() {
    if(req.article.author._id.toString() === req.payload.id.toString()) {
      return req.article.remove().then(function() {
        return res.sendStatus(204) // No content
      })
    } else {
      return res.sendStatus(403) // Forbidden
    }
  })
})

// Endpoint to create comments on articles
router.post('/:article/comments', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user) {
    if(!user) {return res.sendStatus(401)} // Unauthorized

    var comment = new Comment(req.body.comment)
    comment.article = req.article
    comment.author = user
    return comment.save().then(function() {
      req.article.comments.push(comment)
      return req.article.save().then(function(article) {
        res.json({comment: comment.toJSONFor(user)})
      })
    })
  }).catch(next)
})

// Endpoint to list comments on articles
router.get('/:article/comments', auth.optional, function(req, res, next) {
  Promise.resolve(req.payload ? User.findById(req.payload.id) : null).then(function(user) {
    return req.article.populate({
      path: 'comments',
      populate: {
        path: 'author'
      },
      options: {
        sort: {
          createdAt: 'desc'
        }
      }
    }).execPopulate().then(function(article) {
      return res.json({comments: req.article.comments.map(function(comment) {
        return comment.toJSONFor(user)
      })})
    })
  }).catch(next)
})

// Middleware for resolving the /:comment in our URL
router.param('comment', function(req, res, next, id) {
  Comment.findById(id).then(function(comment) {
    if(!comment) {return res.sendStatus(404)} // Not found

    req.comment = comment
    return next()
  }).catch(next)
})

// Endpoint to destroy comments on articles
router.delete('/:article/comments/:comment', auth.required, function(req, res, next) {
  if(req.comment.author.toString() === req.payload.id.toString()) {
    req.article.comments.remove(req.comment._id)
    req.article.save()
      .then(Comment.find({_id: req.comment._id}).remove().exec())
      .then(function() {
        res.sendStatus(204) // No content
      })
  } else {
    res.sendStatus(403) // Forbidden
  }
})

module.exports = router
