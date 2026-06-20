#!/bin/bash
echo "Starting n8n AI Engine..."
docker-compose -f docker-compose.n8n.yml up -d
echo "n8n is starting! It will be available at http://localhost:5678 in a few seconds."
