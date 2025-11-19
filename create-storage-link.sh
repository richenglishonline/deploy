#!/bin/bash
# Create storage symlink manually for Hostinger deployment
# This script should be run on the server via SSH
# For _public_html structure where index.php is at root

cd "$(dirname "$0")"

# Check if we're in _public_html structure (index.php at root)
if [ -f "index.php" ] && [ -d "storage" ]; then
    # _public_html structure: storage link at root level
    STORAGE_LINK="storage_link"
    STORAGE_TARGET="storage/app/public"
    
    # Remove existing link if it exists
    if [ -L "$STORAGE_LINK" ] || [ -L "storage" ]; then
        echo "Removing existing storage link..."
        [ -L "$STORAGE_LINK" ] && rm "$STORAGE_LINK"
        [ -L "storage" ] && rm "storage"
    fi
    
    # Create the symlink at root level
    echo "Creating storage symlink at root level..."
    ln -s "$STORAGE_TARGET" "$STORAGE_LINK"
    
    # Also create storage symlink if public_path() points to root
    if [ ! -L "storage" ]; then
        # Backup storage directory if it's a real directory
        if [ -d "storage" ] && [ ! -L "storage" ]; then
            echo "Note: storage/ is a directory, not a symlink"
        fi
    fi
    
    # Verify the link was created
    if [ -L "$STORAGE_LINK" ]; then
        echo "✓ Storage symlink created successfully at root level!"
        ls -la "$STORAGE_LINK"
    else
        echo "✗ Failed to create storage symlink"
        exit 1
    fi
elif [ -d "public" ]; then
    # Standard Laravel structure: storage link in public directory
    if [ -L "public/storage" ]; then
        echo "Removing existing storage link..."
        rm public/storage
    fi
    
    echo "Creating storage symlink in public directory..."
    ln -s ../storage/app/public public/storage
    
    if [ -L "public/storage" ]; then
        echo "✓ Storage symlink created successfully in public directory!"
        ls -la public/storage
    else
        echo "✗ Failed to create storage symlink"
        exit 1
    fi
else
    echo "✗ Could not determine directory structure"
    echo "Expected either index.php at root or public/ directory"
    exit 1
fi

