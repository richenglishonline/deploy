#!/usr/bin/env node
/**
 * Copy build files from public/build to root build directory
 * Maintains the same directory structure
 * Also commits changes with date/time in commit message
 */

import { cpSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const sourceDir = join(rootDir, 'public', 'build');
const targetDir = join(rootDir, 'build');

console.log('📦 Copying build files...');
console.log(`   From: ${sourceDir}`);
console.log(`   To:   ${targetDir}`);

if (!existsSync(sourceDir)) {
    console.error('❌ Source directory does not exist:', sourceDir);
    process.exit(1);
}

try {
    // Remove existing build directory if it exists
    if (existsSync(targetDir)) {
        console.log('   Removing existing build directory...');
        rmSync(targetDir, { recursive: true, force: true });
    }

    // Copy the entire directory structure
    cpSync(sourceDir, targetDir, { recursive: true });

    console.log('✅ Build files copied successfully!');

    // Commit changes with date/time in commit message
    try {
        // Format date/time as MM/DD/YYYY HH:MM
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const dateTime = `${month}/${day}/${year} ${hours}:${minutes}`;
        const commitMessage = `Fix (${dateTime})`;

        console.log('📝 Staging changes for commit...');
        execSync('git add -A', { cwd: rootDir, stdio: 'inherit' });

        console.log(`💾 Committing with message: "${commitMessage}"`);
        execSync(`git commit -m "${commitMessage}"`, { cwd: rootDir, stdio: 'inherit' });

        console.log('✅ Changes committed successfully!');
    } catch (gitError) {
        // Don't fail the build if git commands fail (e.g., no changes, not a git repo)
        console.warn('⚠️  Git commit skipped:', gitError.message);
        console.log('   (This is normal if there are no changes or not in a git repository)');
    }
} catch (error) {
    console.error('❌ Error copying build files:', error.message);
    process.exit(1);
}



