const express = require('express');
const BlogPost = require('../models/BlogPost');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/blog/posts - Get all published blog posts
router.get('/posts', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      tag, 
      search, 
      author,
      sortBy = 'publishDate',
      sortOrder = 'desc'
    } = req.query;

    const query = { published: true };

    // Add filters
    if (tag) {
      query.tags = { $in: [tag.toLowerCase()] };
    }

    if (author) {
      query.author = new RegExp(author, 'i');
    }

    let posts;

    if (search) {
      // Text search
      posts = await BlogPost.searchPosts(search)
        .limit(limit * 1)
        .skip((page - 1) * limit);
    } else {
      // Regular query with sorting
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      posts = await BlogPost.find(query)
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-content'); // Exclude full content for list view
    }

    const total = search ? 
      (await BlogPost.searchPosts(search)).length :
      await BlogPost.countDocuments(query);

    const totalPages = Math.ceil(total / limit);

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        pages: totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ message: 'Error fetching blog posts' });
  }
});

// GET /api/blog/posts/:slug - Get a single blog post by slug
router.get('/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { incrementViews = false } = req.query;

    const post = await BlogPost.findOne({ slug, published: true });

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Increment views if requested
    if (incrementViews === 'true') {
      await post.incrementViews();
    }

    res.json(post);

  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ message: 'Error fetching blog post' });
  }
});

// GET /api/blog/recent - Get recent blog posts
router.get('/recent', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const posts = await BlogPost.findPublished()
      .limit(parseInt(limit))
      .select('-content');

    res.json(posts);

  } catch (error) {
    console.error('Error fetching recent posts:', error);
    res.status(500).json({ message: 'Error fetching recent posts' });
  }
});

// GET /api/blog/tags - Get all tags
router.get('/tags', async (req, res) => {
  try {
    const tags = await BlogPost.aggregate([
      { $match: { published: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, tag: '$_id', count: 1 } }
    ]);

    res.json(tags);

  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Error fetching tags' });
  }
});

// GET /api/blog/stats - Get blog statistics
router.get('/stats', async (req, res) => {
  try {
    const totalPosts = await BlogPost.countDocuments({ published: true });
    const totalViews = await BlogPost.aggregate([
      { $match: { published: true } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);

    const recentPosts = await BlogPost.countDocuments({
      published: true,
      publishDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalPosts,
      totalViews: totalViews[0]?.totalViews || 0,
      recentPosts
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// Protected routes (require admin authentication)

// GET /api/blog/admin/posts - Get all posts (including unpublished) for admin
router.get('/admin/posts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      published,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (published !== undefined) {
      query.published = published === 'true';
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const posts = await BlogPost.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BlogPost.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        pages: totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching admin posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

// POST /api/blog/admin/posts - Create a new blog post
router.post('/admin/posts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const postData = req.body;

    // Validate required fields
    const requiredFields = ['title', 'excerpt', 'content'];
    for (const field of requiredFields) {
      if (!postData[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Create new blog post
    const newPost = new BlogPost(postData);
    await newPost.save();

    res.status(201).json({
      message: 'Blog post created successfully',
      post: newPost
    });

  } catch (error) {
    console.error('Error creating blog post:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A post with this slug already exists' });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    
    res.status(500).json({ message: 'Error creating blog post' });
  }
});

// GET /api/blog/admin/posts/:id - Get a single post by ID (for editing)
router.get('/admin/posts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID format
    if (!id || id === 'undefined' || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid blog post ID' });
    }

    const post = await BlogPost.findById(id);

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.json(post);

  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ message: 'Error fetching blog post' });
  }
});

// PUT /api/blog/admin/posts/:id - Update a blog post
router.put('/admin/posts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate the ID format
    if (!id || id === 'undefined' || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid blog post ID' });
    }

    const post = await BlogPost.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.json({
      message: 'Blog post updated successfully',
      post
    });

  } catch (error) {
    console.error('Error updating blog post:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A post with this slug already exists' });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    
    res.status(500).json({ message: 'Error updating blog post' });
  }
});

// DELETE /api/blog/admin/posts/:id - Delete a blog post
router.delete('/admin/posts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID format
    if (!id || id === 'undefined' || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid blog post ID' });
    }

    const post = await BlogPost.findByIdAndDelete(id);

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.json({
      message: 'Blog post deleted successfully',
      post: { id: post._id, title: post.title }
    });

  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ message: 'Error deleting blog post' });
  }
});

// PUT /api/blog/admin/posts/:id/publish - Toggle publish status
router.put('/admin/posts/:id/publish', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID format
    if (!id || id === 'undefined' || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid blog post ID' });
    }

    const post = await BlogPost.findById(id);

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    post.published = !post.published;
    await post.save();

    res.json({
      message: `Blog post ${post.published ? 'published' : 'unpublished'} successfully`,
      post
    });

  } catch (error) {
    console.error('Error toggling publish status:', error);
    res.status(500).json({ message: 'Error updating publish status' });
  }
});

module.exports = router;
