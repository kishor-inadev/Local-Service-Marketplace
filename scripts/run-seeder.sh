#!/bin/bash
# Database Seeder - Root Folder Runner (Linux/Mac)
# Run this from the project root folder

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SEEDER_SCRIPT="$SCRIPT_DIR/../database/run-seeder.sh"

if [ ! -f "$SEEDER_SCRIPT" ]; then
    echo "Error: Seeder script not found at: $SEEDER_SCRIPT"
    exit 1
fi

# Make it executable if not already
chmod +x "$SEEDER_SCRIPT"

# Forward all arguments
"$SEEDER_SCRIPT" "$@"
