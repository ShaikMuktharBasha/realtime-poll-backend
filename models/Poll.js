const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  votes: {
    type: Number,
    default: 0
  }
});

const pollSchema = new mongoose.Schema({
  pollId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [optionSchema],
  votedIPs: {
    type: [String],
    default: []
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Poll', pollSchema);
