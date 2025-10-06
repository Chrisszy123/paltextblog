const express = require('express');
const generateSitemap = require('../utils/generateSitemap');
const BlogPost = require('../models/BlogPost');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/sitemap/generate
 * Generate a new sitemap file (admin only)
 */
router.post('/generate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await generateSitemap();
    
    res.json({
      message: 'Sitemap generated successfully',
      postsCount: result.postsCount,
      path: result.path
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ 
      message: 'Failed to generate sitemap',
      error: error.message 
    });
  }
});

/**
 * GET /api/sitemap/xml
 * Serve the sitemap dynamically (no admin required - public endpoint)
 * This works in production when frontend and backend are separate
 */
router.get('/xml', async (req, res) => {
  try {
    const posts = await BlogPost.find({ published: true })
      .sort({ publishDate: -1 })
      .select('slug publishDate updatedAt');

    const today = new Date().toISOString().split('T')[0];
    
    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- 🏠 Homepage -->
  <url>
    <loc>https://www.paltextai.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- 📰 Blog Index -->
  <url>
    <loc>https://www.paltextai.com/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

`;

    // Add blog posts
    posts.forEach((post, index) => {
      const lastmod = post.updatedAt 
        ? new Date(post.updatedAt).toISOString().split('T')[0]
        : new Date(post.publishDate).toISOString().split('T')[0];
      
      const priority = index < 10 ? '0.8' : '0.7';
      
      xml += `  <url>
    <loc>https://www.paltextai.com/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>

`;
    });

    xml += `</urlset>`;

    // Set proper content type
    res.header('Content-Type', 'application/xml');
    res.send(xml);

  } catch (error) {
    console.error('Error serving sitemap:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>');
  }
});

module.exports = router;
