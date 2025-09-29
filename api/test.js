module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, url } = req;

  // Test endpoint
  if (method === 'GET' && (url === '/api/test' || url === '/test')) {
    res.json({ 
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      method: method,
      url: url
    });
    return;
  }

  // Health check
  if (method === 'GET' && (url === '/api/health' || url === '/health')) {
    res.json({ 
      status: 'OK',
      message: 'Test API is running',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Root endpoint
  if (method === 'GET' && (url === '/' || url === '/api')) {
    res.json({
      message: 'PalText Blog API Test',
      endpoints: [
        'GET /api/health - Health check',
        'GET /api/test - Test endpoint'
      ],
      timestamp: new Date().toISOString()
    });
    return;
  }

  // 404 for unknown routes
  res.status(404).json({ 
    message: 'Endpoint not found',
    method: method,
    url: url,
    availableEndpoints: ['/api/health', '/api/test']
  });
};
