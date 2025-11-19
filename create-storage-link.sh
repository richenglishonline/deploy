#!/bin/bash
# Create storage symlink manually for Hostinger deployment
# This script should be run on the server via SSH
# Works for both standard Laravel and _public_html structures

cd "$(dirname "$0")"

# Laravel expects the storage link at public/storage pointing to storage/app/public
# This works for both standard Laravel and _public_html (which has public/ directory)

if [ -d "public" ] && [ -d "storage/app/public" ]; then
    # Remove existing link if it exists
    if [ -L "public/storage" ]; then
        echo "Removing existing storage link..."
        rm public/storage
    fi
    
    # Create the symlink in public directory
    echo "Creating storage symlink: public/storage -> storage/app/public"
    ln -s ../storage/app/public public/storage
    
    # Verify the link was created
    if [ -L "public/storage" ]; then
        echo "✓ Storage symlink created successfully!"
        echo "Link details:"
        ls -la public/storage
    else
        echo "✗ Failed to create storage symlink"
        exit 1
    fi
elif [ -f "index.php" ] && [ -d "storage/app/public" ]; then
    # _public_html structure without public/ directory (unlikely but handle it)
    echo "Warning: No public/ directory found, but index.php exists at root"
    echo "Creating storage symlink at root level as fallback..."
    
    if [ -L "storage_link" ]; then
        rm storage_link
    fi
    
    ln -s storage/app/public storage_link
    
    if [ -L "storage_link" ]; then
        echo "✓ Storage symlink created at root level (storage_link)"
        ls -la storage_link
        echo "Note: You may need to adjust config/filesystems.php to use this location"
    else
        echo "✗ Failed to create storage symlink"
        exit 1
    fi
else
    echo "✗ Could not determine directory structure"
    echo "Expected:"
    echo "  - public/ directory with storage/app/public directory, OR"
    echo "  - index.php at root with storage/app/public directory"
    exit 1
fi
