# PalText Blog API

Backend API for the PalText AI blog system built with Node.js, Express.js, and MongoDB.

## Features

- **MongoDB Integration**: Robust data storage with Mongoose ODM
- **JWT Authentication**: Secure admin authentication
- **CRUD Operations**: Full create, read, update, delete functionality for blog posts
- **Image Upload**: Support for image uploads with Cloudinary integration
- **SEO Optimization**: Built-in SEO features and metadata management
- **Search & Filtering**: Text search, tag filtering, and pagination
- **Security**: Rate limiting, CORS protection, and input validation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Optional: Cloudinary account for image uploads

## Installation

1. Clone or navigate to the project directory:
```bash
cd PalTextBlogAPI
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env` (if available) or create a new `.env` file
   - Update the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/paltext-blog

# JWT Secret (Change this to a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Admin Credentials
ADMIN_PASSWORD=paltext2024admin

# Cloudinary Configuration (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

4. Start MongoDB (if running locally):
```bash
mongod
```

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Logout

### Public Blog Endpoints

- `GET /api/blog/posts` - Get published blog posts (with pagination, search, filtering)
- `GET /api/blog/posts/:slug` - Get a single blog post by slug
- `GET /api/blog/recent` - Get recent blog posts
- `GET /api/blog/tags` - Get all tags with post counts
- `GET /api/blog/stats` - Get blog statistics

### Admin Blog Endpoints (Requires Authentication)

- `GET /api/blog/admin/posts` - Get all posts (including unpublished)
- `POST /api/blog/admin/posts` - Create a new blog post
- `GET /api/blog/admin/posts/:id` - Get a single post by ID
- `PUT /api/blog/admin/posts/:id` - Update a blog post
- `DELETE /api/blog/admin/posts/:id` - Delete a blog post
- `PUT /api/blog/admin/posts/:id/publish` - Toggle publish status

### Upload Endpoints (Requires Authentication)

- `POST /api/upload/image` - Upload an image
- `DELETE /api/upload/image/:publicId` - Delete an image from Cloudinary

### Health Check

- `GET /api/health` - API health status

## Query Parameters

### GET /api/blog/posts

- `page` - Page number (default: 1)
- `limit` - Posts per page (default: 10)
- `tag` - Filter by tag
- `search` - Text search in title, excerpt, and content
- `author` - Filter by author
- `sortBy` - Sort field (default: publishDate)
- `sortOrder` - Sort order: asc/desc (default: desc)

Example:
```
GET /api/blog/posts?page=1&limit=5&tag=AI&search=customer%20service
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints:

1. Login with admin credentials:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password": "paltext2024admin"}'
```

2. Use the returned token in subsequent requests:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/blog/admin/posts
```

## Database Schema

### BlogPost Model

```javascript
{
  title: String (required, max 200 chars)
  slug: String (required, unique, auto-generated)
  excerpt: String (required, max 500 chars)
  content: String (required)
  featuredImage: String (URL)
  author: String (default: "PalText Team")
  tags: [String] (lowercase)
  metaDescription: String (max 160 chars)
  seoKeywords: [String] (lowercase)
  published: Boolean (default: true)
  publishDate: Date (default: now)
  updatedAt: Date (auto-updated)
  views: Number (default: 0)
  readingTime: Number (auto-calculated in minutes)
}
```

## Sample Data

The API automatically initializes with sample blog posts when the database is empty. This includes SEO-optimized content about AI and customer service.

## Error Handling

The API returns consistent error responses:

```json
{
  "message": "Error description",
  "errors": ["Detailed validation errors"] // if applicable
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configurable allowed origins
- **Helmet**: Security headers
- **Input Validation**: Mongoose schema validation
- **JWT Expiration**: 24-hour token expiry

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Database Indexes

The API creates the following indexes for optimal performance:
- `publishDate` (descending)
- `published + publishDate` (compound)
- `tags`
- `author`
- Text index on `title`, `excerpt`, and `content`

## Deployment

1. Set `NODE_ENV=production` in your environment
2. Use a secure `JWT_SECRET`
3. Configure MongoDB Atlas or your production database
4. Set up Cloudinary for image uploads
5. Configure proper CORS origins
6. Use a process manager like PM2

## Contributing

1. Follow the existing code style
2. Add appropriate error handling
3. Include input validation
4. Update documentation for new endpoints
5. Test thoroughly before submitting

## License

MIT License - see LICENSE file for details.
