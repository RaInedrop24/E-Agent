#!/bin/sh
if [ -f SETUP_SERVICE_ROLE_KEY.md ]; then
  # Replace the JWT token with [REDACTED]
  sed -i 's/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[^ ]*/[REDACTED]/g' SETUP_SERVICE_ROLE_KEY.md
fi

