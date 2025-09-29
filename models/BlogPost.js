const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    trim: true,
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  featuredImage: {
    type: String,
    trim: true
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
    default: 'PalText Team'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  seoKeywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  published: {
    type: Boolean,
    default: true
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  views: {
    type: Number,
    default: 0
  },
  readingTime: {
    type: Number, // in minutes
    default: 1
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate slug and calculate reading time
blogPostSchema.pre('save', function(next) {
  // Generate slug from title if not provided
  if (!this.slug || this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  // Calculate reading time (average 200 words per minute)
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }
  
  // Update the updatedAt field
  this.updatedAt = new Date();
  
  next();
});

// Indexes for better query performance
blogPostSchema.index({ publishDate: -1 });
blogPostSchema.index({ published: 1, publishDate: -1 });
blogPostSchema.index({ tags: 1 });
blogPostSchema.index({ author: 1 });
blogPostSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

// Instance methods
blogPostSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Static methods
blogPostSchema.statics.findPublished = function() {
  return this.find({ published: true }).sort({ publishDate: -1 });
};

blogPostSchema.statics.findByTag = function(tag) {
  return this.find({ 
    published: true, 
    tags: { $in: [tag.toLowerCase()] } 
  }).sort({ publishDate: -1 });
};

blogPostSchema.statics.searchPosts = function(query) {
  return this.find({
    published: true,
    $text: { $search: query }
  }, {
    score: { $meta: 'textScore' }
  }).sort({
    score: { $meta: 'textScore' },
    publishDate: -1
  });
};

// Virtual for formatted publish date
blogPostSchema.virtual('formattedPublishDate').get(function() {
  return this.publishDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for URL
blogPostSchema.virtual('url').get(function() {
  return `/blog/${this.slug}`;
});

// Ensure virtual fields are serialized
blogPostSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
