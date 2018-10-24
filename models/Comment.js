'use strict'

let mongoose = require('mongoose')

let CommentSchema = new mongoose.Schema({
  body: String,
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  article: {type: mongoose.Schema.Types.ObjectId, ref: 'Article'}
}, {timestamps: true})

// Comments model requires population of author
CommentSchema.methods.toJSONFor = function(user) {
  return {
    id: this._id,
    body: this.body,
    createdAt: this.createdAt,
    author: this.author.toProfileJSONFor(user)
  }
}

mongoose.model('Comment', CommentSchema)
