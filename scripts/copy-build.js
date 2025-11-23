#!/usr/bin/env node
/**
 * Copy build files from public/build to root build directory
 * Maintains the same directory structure
 */

import { cpSync, existsSync, rmSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const sourceDir = join(rootDir, 'public', 'build');
const targetDir = join(rootDir, 'build');
const hotFilePath = join(rootDir, 'public', 'hot');

console.log('📦 Copying build files...');
console.log(`   From: ${sourceDir}`);
console.log(`   To:   ${targetDir}`);

if (!existsSync(sourceDir)) {
    console.error('❌ Source directory does not exist:', sourceDir);
    process.exit(1);
}

try {
    // Remove hot file if it exists (should not be in production)
    if (existsSync(hotFilePath)) {
        console.log('   Removing hot file...');
        unlinkSync(hotFilePath);
    }

    // Remove existing build directory if it exists
    if (existsSync(targetDir)) {
        console.log('   Removing existing build directory...');
        rmSync(targetDir, { recursive: true, force: true });
    }

    // Copy the entire directory structure
    cpSync(sourceDir, targetDir, { recursive: true });

    console.log('✅ Build files copied successfully!');
} catch (error) {
    console.error('❌ Error copying build files:', error.message);
    process.exit(1);
}



