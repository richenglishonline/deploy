#!/bin/bash
# Create storage symlink manually for Hostinger deployment
# This script should be run on the server via SSH

cd "$(dirname "$0")"

# Remove existing link if it exists
if [ -L "public/storage" ]; then
    echo "Removing existing storage link..."
    rm public/storage
fi

# Create the symlink manually
echo "Creating storage symlink..."
ln -s ../storage/app/public public/storage

# Verify the link was created
if [ -L "public/storage" ]; then
    echo "✓ Storage symlink created successfully!"
    ls -la public/storage
else
    echo "✗ Failed to create storage symlink"
    exit 1
fi

