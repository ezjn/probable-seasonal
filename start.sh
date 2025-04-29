#!/bin/bash

# Convert Excel to JSON if needed
if [ ! -f produce_data.json ] || [ uk_seasonal_produce.xlsx -nt produce_data.json ]; then
    echo "Converting Excel data to JSON..."
    node convert.js
fi

# Start the server
echo "Starting server at http://localhost:8000"
echo "Press Ctrl+C to stop the server"
python3 -m http.server 8000 