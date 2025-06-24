const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  type: {
    type: String,
    enum: ['training', 'testing', 'validation'],
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  metadata: {
    features: [String],
    targetVariable: String,
    rowCount: Number,
    columnCount: Number
  },
  userId: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Dataset', datasetSchema); 