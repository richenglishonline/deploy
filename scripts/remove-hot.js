#!/usr/bin/env node
/**
 * Remove the hot file after production build
 * The hot file should only exist during development
 */

import { unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const hotFilePath = join(rootDir, 'public', 'hot');

if (existsSync(hotFilePath)) {
    try {
        unlinkSync(hotFilePath);
        console.log('✅ Removed hot file (production build)');
    } catch (error) {
        console.warn('⚠️  Warning: Could not remove hot file:', error.message);
    }
} else {
    console.log('ℹ️  No hot file found (already clean)');
}

