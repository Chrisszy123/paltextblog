#!/bin/bash

# Start the PalText Blog API server on port 5001
# This avoids conflicts with Apple's AirTunes service on port 5000

echo "Starting PalText Blog API server on port 5001..."
echo "Server will be available at: http://localhost:5001/api"
echo "Health check: http://localhost:5001/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

PORT=5001 node server.js
