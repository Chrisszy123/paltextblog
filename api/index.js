const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const blogRoutes = require('../routes/blogRoutes');
const authRoutes = require('../routes/authRoutes');
const uploadRoutes = require('../routes/uploadRoutes');

const app = express();

// Basic middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// MongoDB connection with retry logic
let isConnected = false;

async function connectDB() {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  try {
    console.log('Attempting to connect to MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log('Successfully connected to MongoDB');

    // Initialize sample data
    await initializeSampleData();

  } catch (error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    throw error;
  }
}

// Initialize sample data
async function initializeSampleData() {
  try {
    const BlogPost = require('../models/BlogPost');
    const postCount = await BlogPost.countDocuments();
    
    if (postCount === 0) {
      console.log('Initializing sample blog data...');
      
      const samplePosts = [
        {
          title: "How AI is Revolutionizing Customer Service Communication",
          slug: "ai-revolutionizing-customer-service-communication",
          excerpt: "Discover how artificial intelligence is transforming the way businesses communicate with their customers, improving response times and satisfaction rates.",
          content: `# How AI is Revolutionizing Customer Service Communication

In today's fast-paced digital world, customer service has become the cornerstone of business success. With the advent of artificial intelligence, companies are now able to provide unprecedented levels of customer support that are both efficient and personalized.

## The Evolution of Customer Service

Traditional customer service methods often left customers waiting in long queues or struggling to find relevant information. The introduction of AI-powered solutions has completely transformed this landscape.

### Key Benefits of AI in Customer Service:

- **24/7 Availability**: AI systems never sleep, ensuring customers can get help whenever they need it
- **Instant Response Times**: No more waiting on hold or for email responses
- **Personalized Interactions**: AI can analyze customer history to provide tailored responses
- **Cost Efficiency**: Reduced operational costs while maintaining high service quality
- **Scalability**: Handle thousands of conversations simultaneously

## Real-World Applications

Companies across various industries are implementing AI solutions to enhance their customer service:

### E-commerce
Online retailers use AI chatbots to help customers find products, track orders, and resolve issues instantly.

### Banking and Finance
Financial institutions deploy AI to handle routine inquiries, fraud detection, and account management.

### Healthcare
Healthcare providers use AI to schedule appointments, answer basic health questions, and manage patient communications.

## The Future of AI Customer Service

As AI technology continues to evolve, we can expect even more sophisticated features:

- Advanced natural language understanding
- Emotional intelligence in AI responses
- Seamless integration with human agents
- Predictive customer service needs

## Conclusion

The integration of AI in customer service is not just a trend—it's a necessity for businesses looking to stay competitive in the digital age. Companies that embrace these technologies early will have a significant advantage in customer satisfaction and operational efficiency.

*Ready to revolutionize your customer service with AI? Contact us today to learn how PalText can transform your business communications.*`,
          featuredImage: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=800&h=400&fit=crop",
          author: "PalText Team",
          tags: ["AI", "Customer Service", "Technology", "Business"],
          metaDescription: "Learn how AI is transforming customer service communication, improving response times and customer satisfaction rates across industries.",
          seoKeywords: ["AI customer service", "artificial intelligence", "customer communication", "automated support", "chatbots"],
          published: true
        }
      ];

      await BlogPost.insertMany(samplePosts);
      console.log('Sample blog data initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
    // Don't throw here, just log the error
  }
}

// Middleware to ensure database connection
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ 
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PalText Blog API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    database: isConnected ? 'connected' : 'disconnected'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Export the Express app for Vercel
module.exports = app;