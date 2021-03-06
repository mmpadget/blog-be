'use strict'

const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const slugify = require('slugify')

const User = mongoose.model('User')

const ArticleSchema = new mongoose.Schema({
  slug: {type: String, lowercase: true, unique: true},
  title: String,
  description: String,
  body: String,
  favoritesCount: {type: Number, default: 0},
  tagList: [{type: String}],
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}]
}, {timestamps: true})

ArticleSchema.plugin(uniqueValidator, {message: 'is already taken'})

// A method for generating unique article slugs
ArticleSchema.methods.slugify = function() {
  this.slug = slugify(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36)
}

// Use Mongoose middleware to invoke the slugify method. Generate the slug before Mongoose tries to validate the model.
ArticleSchema.pre('validate', function(next) {
  if(!this.slug) {
    this.slugify()
  }
  next()
})

// Method that returns the JSON of an article
ArticleSchema.methods.toJSONFor = function(user) {
  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    body: this.body,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    tagList: this.tagList,
    favorited: user ? user.isFavorite(this._id) : false,
    favoritesCount: this.favoritesCount,
    author: this.author.toProfileJSONFor(user)
  }
}

// A method to update an article's favorite count
ArticleSchema.methods.updateFavoriteCount = function() {
  let article = this
  return User.count({favorites: {$in: [article._id]}}).then(function(count) {
    article.favoritesCount = count
    return article.save()
  })
}

mongoose.model('Article', ArticleSchema)
