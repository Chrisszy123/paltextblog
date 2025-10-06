const fs = require('fs');
const path = require('path');
const BlogPost = require('../models/BlogPost');

/**
 * Generate dynamic sitemap.xml with all published blog posts
 * Run this script after adding/updating blog posts
 */
async function generateSitemap() {
  try {
    console.log('📝 Generating sitemap...');

    // Fetch all published blog posts
    const posts = await BlogPost.find({ published: true })
      .sort({ publishDate: -1 })
      .select('slug publishDate updatedAt');

    const today = new Date().toISOString().split('T')[0];
    
    // Start building the XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- 🏠 Homepage - Highest Priority -->
  <url>
    <loc>https://www.paltextai.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- 📰 Blog Index - High Priority for Content Discovery -->
  <url>
    <loc>https://www.paltextai.com/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

`;

    // Add each blog post
    posts.forEach((post, index) => {
      const lastmod = post.updatedAt 
        ? new Date(post.updatedAt).toISOString().split('T')[0]
        : new Date(post.publishDate).toISOString().split('T')[0];
      
      // Recent posts (first 10) get higher priority
      const priority = index < 10 ? '0.8' : '0.7';
      
      xml += `  <!-- Blog Post: ${post.slug} -->
  <url>
    <loc>https://www.paltextai.com/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>

`;
    });

    // Close the XML
    xml += `</urlset>`;

    // Write to the public folder of the React app
    const publicPath = path.join(__dirname, '../../public/sitemap.xml');
    fs.writeFileSync(publicPath, xml, 'utf8');

    console.log(`✅ Sitemap generated successfully with ${posts.length} blog posts!`);
    console.log(`📍 Location: ${publicPath}`);
    
    return {
      success: true,
      postsCount: posts.length,
      path: publicPath
    };

  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    throw error;
  }
}

// If run directly (not imported)
if (require.main === module) {
  const mongoose = require('mongoose');
  require('dotenv').config();

  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('Connected to MongoDB');
    await generateSitemap();
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
}

module.exports = generateSitemap;

