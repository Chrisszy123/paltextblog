const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const blogRoutes = require('../routes/blogRoutes');
const authRoutes = require('../routes/authRoutes');
const uploadRoutes = require('../routes/uploadRoutes');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection - optimized for serverless
let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    console.log('Connecting to MongoDB...');
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    cachedConnection = connection;
    console.log('Connected to MongoDB');
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Initialize sample data function
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
        },
        {
          title: "10 Best Practices for Implementing AI Chatbots in Your Business",
          slug: "best-practices-implementing-ai-chatbots-business",
          excerpt: "Learn the essential strategies for successfully integrating AI chatbots into your business operations and maximizing their effectiveness.",
          content: `# 10 Best Practices for Implementing AI Chatbots in Your Business

Implementing AI chatbots can transform your customer service operations, but success depends on following proven best practices. Here's your comprehensive guide to chatbot implementation.

## 1. Define Clear Objectives

Before implementing any AI chatbot solution, establish clear goals:
- What problems are you trying to solve?
- Which customer interactions can be automated?
- What metrics will you use to measure success?

## 2. Choose the Right Platform

Select a chatbot platform that aligns with your business needs:
- Integration capabilities with existing systems
- Scalability for future growth
- Customization options
- Analytics and reporting features

## 3. Design Conversational Flows

Create intuitive conversation paths:
- Map out common customer journeys
- Prepare for various scenarios and edge cases
- Include fallback options for complex queries
- Test flows with real users

## 4. Train Your AI Properly

Invest time in training your chatbot:
- Use real customer data and conversations
- Continuously update the knowledge base
- Monitor and improve response accuracy
- Regular retraining with new data

## 5. Maintain Human Oversight

Always provide human backup:
- Clear escalation paths to human agents
- Monitor conversations for quality
- Regular review of chatbot performance
- Human intervention for sensitive issues

## 6. Focus on User Experience

Prioritize customer experience:
- Keep conversations natural and friendly
- Provide clear instructions and options
- Minimize user effort required
- Offer multiple contact methods

## 7. Implement Gradual Rollout

Start small and scale up:
- Begin with simple use cases
- Gather feedback and iterate
- Gradually expand capabilities
- Monitor performance at each stage

## 8. Ensure Data Privacy and Security

Protect customer information:
- Implement strong data encryption
- Follow privacy regulations (GDPR, CCPA)
- Regular security audits
- Clear privacy policies

## 9. Monitor and Analyze Performance

Track key metrics:
- Response accuracy rates
- Customer satisfaction scores
- Resolution times
- Escalation rates to human agents

## 10. Continuous Improvement

Never stop optimizing:
- Regular performance reviews
- Customer feedback integration
- Technology updates and improvements
- Staff training on new features

## Conclusion

Successful AI chatbot implementation requires careful planning, proper execution, and continuous optimization. By following these best practices, you can create a chatbot that truly enhances your customer experience and business operations.

*Ready to implement AI chatbots in your business? PalText offers comprehensive solutions tailored to your specific needs.*`,
          featuredImage: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop",
          author: "PalText Team",
          tags: ["AI Chatbots", "Implementation", "Best Practices", "Business Strategy"],
          metaDescription: "Discover 10 essential best practices for successfully implementing AI chatbots in your business operations and maximizing customer satisfaction.",
          seoKeywords: ["AI chatbot implementation", "chatbot best practices", "business automation", "customer service automation", "AI integration"],
          published: true
        }
      ];

      await BlogPost.insertMany(samplePosts);
      console.log('Sample blog data initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}

// Middleware to ensure database connection
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
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
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Initialize sample data on first connection
let dataInitialized = false;
app.use(async (req, res, next) => {
  if (!dataInitialized) {
    try {
      await initializeSampleData();
      dataInitialized = true;
    } catch (error) {
      console.error('Failed to initialize sample data:', error);
    }
  }
  next();
});

// Export the Express app for Vercel
module.exports = app;
