#!/usr/bin/env node
/**
 * Copy build files from public/build to root build directory
 * Maintains the same directory structure
 * Also commits changes with AI-generated commit message using Hugging Face (or timestamp fallback)
 */

import { cpSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import axios from 'axios';

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

    // Generate commit message using AI (with timestamp fallback)
    try {
        console.log('📝 Staging changes for commit...');
        execSync('git add -A', { cwd: rootDir, stdio: 'inherit' });

        // Get git changes
        let diff = '';
        let files = '';
        try {
            diff = execSync('git diff --cached --stat', { cwd: rootDir, encoding: 'utf-8' });
            files = execSync('git diff --cached --name-only', { cwd: rootDir, encoding: 'utf-8' });
        } catch (e) {
            // No changes or not a git repo
            throw new Error('No changes to commit');
        }

        // Try to generate AI commit message
        let commitMessage = await generateAICommitMessage(diff, files);
        
        // Fallback to timestamp if AI fails
        if (!commitMessage) {
            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const year = now.getFullYear();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const dateTime = `${month}/${day}/${year} ${hours}:${minutes}`;
            commitMessage = `Fix (${dateTime})`;
            console.log('⚠️  AI commit message generation failed, using timestamp');
        } else {
            console.log('🤖 AI-generated commit message');
        }

        console.log(`💾 Committing with message: "${commitMessage}"`);
        execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { cwd: rootDir, stdio: 'inherit' });

        console.log('✅ Changes committed successfully!');

        // Push changes to remote repository
        console.log('🚀 Pushing changes to origin main...');
        execSync('git push origin main', { cwd: rootDir, stdio: 'inherit' });

        console.log('✅ Changes pushed successfully!');
    } catch (gitError) {
        // Don't fail the build if git commands fail (e.g., no changes, not a git repo)
        console.warn('⚠️  Git operation skipped:', gitError.message);
        console.log('   (This is normal if there are no changes or not in a git repository)');
    }
} catch (error) {
    console.error('❌ Error copying build files:', error.message);
    process.exit(1);
}

/**
 * Generate commit message using Hugging Face Inference API
 * @param {string} diff - Git diff statistics
 * @param {string} files - Changed file names
 * @returns {Promise<string|null>} - Generated commit message or null if failed
 */
async function generateAICommitMessage(diff, files) {
    try {
        const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
        if (!HF_API_KEY) {
            console.log('⚠️  HUGGINGFACE_API_KEY not set, skipping AI commit message');
            return null;
        }

        // Truncate diff if too long (HF models have token limits)
        const maxDiffLength = 1000;
        const truncatedDiff = diff.length > maxDiffLength 
            ? diff.substring(0, maxDiffLength) + '... (truncated)'
            : diff;

        // Create prompt for AI
        const prompt = `Analyze these git changes and generate a concise commit message following conventional commit format (<type>(<scope>): <subject>).

Changed files:
${files}

Changes:
${truncatedDiff}

Generate only the commit message following this format: <type>(<scope>): <subject>
Do not include any explanation or additional text, only the commit message:`;

        // Use Hugging Face Inference API
        // Recommended models: 'meta-llama/Llama-2-7b-chat-hf', 'bigcode/starcoder', 'gpt2'
        const MODEL = process.env.HF_MODEL || 'gpt2';
        const HF_API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;

        console.log('🤖 Generating commit message with Hugging Face AI...');
        console.log(`   Model: ${MODEL}`);

        // Call HF API with timeout
        const response = await axios.post(
            HF_API_URL,
            {
                inputs: prompt,
                parameters: {
                    max_new_tokens: 100,
                    temperature: 0.7,
                    return_full_text: false
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${HF_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            }
        );

        // Extract generated text from response
        let generatedText = '';
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            generatedText = response.data[0].generated_text || '';
        } else if (response.data && response.data.generated_text) {
            generatedText = response.data.generated_text;
        }

        if (!generatedText) {
            console.warn('⚠️  No response from AI model');
            return null;
        }

        // Clean up the response - extract just the commit message
        // Remove the prompt if it's included in the response
        let commitMessage = generatedText.trim();
        
        // Remove the prompt text if it appears in the response
        if (commitMessage.includes(prompt.substring(0, 50))) {
            commitMessage = commitMessage.replace(prompt, '').trim();
        }

        // Extract the first line (commit message should be one line)
        commitMessage = commitMessage.split('\n')[0].trim();

        // Remove quotes if wrapped in quotes
        commitMessage = commitMessage.replace(/^["']|["']$/g, '');

        // Validate the message is not empty
        if (!commitMessage || commitMessage.length < 3) {
            console.warn('⚠️  Generated commit message is too short or empty');
            return null;
        }

        console.log(`✅ AI generated: "${commitMessage}"`);
        return commitMessage;

    } catch (error) {
        // Handle various error cases
        if (error.response) {
            // API error
            if (error.response.status === 503) {
                console.warn('⚠️  Model is loading, please wait a moment and try again');
            } else if (error.response.status === 429) {
                console.warn('⚠️  Rate limit exceeded, please try again later');
            } else {
                console.warn(`⚠️  API error: ${error.response.status} - ${error.response.statusText}`);
            }
        } else if (error.code === 'ECONNABORTED') {
            console.warn('⚠️  Request timeout (model may be loading)');
        } else {
            console.warn(`⚠️  AI generation error: ${error.message}`);
        }
        return null;
    }
}

