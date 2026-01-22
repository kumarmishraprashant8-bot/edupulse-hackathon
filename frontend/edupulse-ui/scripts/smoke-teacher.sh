#!/bin/bash
# Smoke test for teacher query endpoint
# Usage: ./scripts/smoke-teacher.sh

set -e

API_BASE_URL="${VITE_API_BASE_URL:-http://127.0.0.1:8000}"
ENDPOINT="${API_BASE_URL}/api/teacher/query"

echo "🧪 EduPulse Teacher Query Smoke Test"
echo "======================================"
echo "Testing endpoint: $ENDPOINT"
echo ""

# Test 1: Basic query submission
echo "Test 1: Submitting a sample teacher query..."
RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "cluster": "Cluster A",
    "topic": "subtraction-borrowing",
    "text": "Students confused about subtraction borrowing when there is a zero in tens place",
    "consent_given": true
  }')

if [ $? -eq 0 ]; then
  echo "✅ Request successful"
  echo "Response: $RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  
  # Extract query ID
  QUERY_ID=$(echo "$RESPONSE" | jq -r '.id' 2>/dev/null || echo "")
  
  if [ -n "$QUERY_ID" ] && [ "$QUERY_ID" != "null" ]; then
    echo "✅ Query ID received: $QUERY_ID"
    
    # Test 2: Flag to CRP
    echo ""
    echo "Test 2: Flagging query to CRP..."
    FLAG_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/teacher/flag" \
      -H "Content-Type: application/json" \
      -d "{
        \"query_id\": \"$QUERY_ID\",
        \"reason\": \"Smoke test flag\"
      }")
    
    if [ $? -eq 0 ]; then
      echo "✅ Flag request successful"
      echo "Response: $FLAG_RESPONSE" | jq '.' 2>/dev/null || echo "$FLAG_RESPONSE"
    else
      echo "❌ Flag request failed"
      exit 1
    fi
  else
    echo "⚠️  Warning: No query ID in response"
  fi
else
  echo "❌ Request failed"
  exit 1
fi

echo ""
echo "✅ All smoke tests passed!"

