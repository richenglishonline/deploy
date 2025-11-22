#!/usr/bin/env node
/**
 * Copy build files from public/build to root build directory
 * Maintains the same directory structure
 * Also commits changes with AI-generated commit message using Hugging Face (or timestamp fallback)
 */

// Load environment variables from .env file
import { config } from 'dotenv';
import { cpSync, existsSync, rmSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load .env file from project root
config({ path: resolve(rootDir, '.env') });

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
        // Try Google Gemini API first (preferred - faster and better quality)
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (GEMINI_API_KEY) {
            return await generateWithGemini(diff, files, GEMINI_API_KEY);
        }

        // Fallback to Hugging Face API
        const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
        if (!HF_API_KEY) {
            console.log('⚠️  GEMINI_API_KEY or HUGGINGFACE_API_KEY not set, skipping AI commit message');
            console.log('   Set GEMINI_API_KEY for best results (free tier available)');
            return null;
        }

        // Truncate diff if too long (HF models have token limits)
        const maxDiffLength = 1000;
        const truncatedDiff = diff.length > maxDiffLength 
            ? diff.substring(0, maxDiffLength) + '... (truncated)'
            : diff;

        // Create prompt for AI (optimized for instruction-tuned models)
        const prompt = `<s>[INST] Analyze these git changes and generate a concise commit message following conventional commit format (<type>(<scope>): <subject>).

Changed files:
${files}

Changes:
${truncatedDiff}

Generate only the commit message following this format: <type>(<scope>): <subject>
Do not include any explanation or additional text, only the commit message. [/INST]`;

        // Use Hugging Face Inference API
        // Try models in order (first available will be used)
        // Using models from Hugging Face that are available for inference
        const FALLBACK_MODELS = [
            process.env.HF_MODEL, // User-specified model first
            // Popular and well-performing models (from Hugging Face trending page)
            'meta-llama/Llama-3.1-8B-Instruct', // 5.21M downloads, 4.98k likes - Best for instructions
            'openai/gpt-oss-20b', // 6M downloads, 3.97k likes
            'openai/gpt-oss-120b', // 4.36M downloads, 4.18k likes
            'moonshotai/Kimi-K2-Thinking', // 218k downloads, 1.35k likes
            'MiniMaxAI/MiniMax-M2', // 936k downloads, 1.34k likes
            'zai-org/GLM-4.6', // 84.6k downloads, 1.08k likes
            'deepseek-ai/DeepSeek-V3.2-Exp', // 75.8k downloads, 819 likes
            'miromind-ai/MiroThinker-v1.0-72B', // 2.23k downloads, 112 likes
            'allenai/Olmo-3-1125-32B', // 4.05k downloads, 52 likes
            'WeiboAI/VibeThinker-1.5B', // 14k downloads, 434 likes
            'miromind-ai/MiroThinker-v1.0-8B', // 1.3k downloads, 47 likes
            'allenai/Olmo-3-7B-Instruct', // 2.25k downloads, 37 likes
            'ai-sage/GigaChat3-10B-A1.8B', // 1.81k downloads, 34 likes
            'MaziyarPanahi/VibeThinker-1.5B-GGUF', // 8.55k downloads, 30 likes
            'allenai/Olmo-3-7B-Think', // 4.06k downloads, 29 likes
            'salakash/SamKash-Tolstoy', // 3.05k downloads, 282 likes
            'PleIAs/Baguettotron', // 6.77k downloads, 188 likes
            'cerebras/MiniMax-M2-REAP-162B-A10B', // 3.73k downloads, 68 likes
            'p-e-w/gpt-oss-20b-heretic', // 1.89k downloads, 46 likes
            'ai-sage/GigaChat3-702B-A36B-preview', // 280 downloads, 63 likes
            // Fallback models (smaller/faster)
            'google/flan-t5-base', // Instruction following (smaller, faster)
            'microsoft/DialoGPT-medium', // Conversational model
            'distilgpt2' // Smaller GPT-2 variant
        ].filter(Boolean); // Remove undefined values

        // Try each model until one works
        let response = null;
        let usedModel = null;
        let lastError = null;

        for (const MODEL of FALLBACK_MODELS) {
            const HF_API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;
            
            try {
                console.log('🤖 Generating commit message with Hugging Face AI...');
                console.log(`   Trying model: ${MODEL}`);

                // Call HF API with timeout
                response = await axios.post(
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
                
                usedModel = MODEL;
                console.log(`   ✅ Successfully using model: ${MODEL}`);
                break; // Success, exit loop
                
            } catch (error) {
                lastError = error;
                if (error.response) {
                    // If 410 (Gone) or 404 (Not Found), try next model
                    if (error.response.status === 410 || error.response.status === 404) {
                        console.log(`   ⚠️  Model ${MODEL} not available, trying next...`);
                        continue; // Try next model
                    }
                    // Other errors, break and handle
                    break;
                }
                // Network/timeout errors, try next model
                console.log(`   ⚠️  Error with model ${MODEL}, trying next...`);
            }
        }

        // If all models failed, throw error
        if (!response || !usedModel) {
            throw lastError || new Error('All models failed');
        }

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
            } else if (error.response.status === 410) {
                console.warn('⚠️  Model endpoint no longer available (410 Gone)');
                console.warn('   Tried all fallback models. Set HF_MODEL in .env to use a specific model.');
            } else if (error.response.status === 404) {
                console.warn('⚠️  Model not found (404 Not Found)');
                console.warn('   Please check HF_MODEL in .env or let it use default models');
            } else {
                console.warn(`⚠️  API error: ${error.response.status} - ${error.response.statusText}`);
            }
        } else if (error.code === 'ECONNABORTED') {
            console.warn('⚠️  Request timeout (model may be loading)');
        } else if (error.message === 'All models failed') {
            console.warn('⚠️  All AI models failed. Using timestamp fallback.');
        } else {
            console.warn(`⚠️  AI generation error: ${error.message}`);
        }
        return null;
    }
}

/**
 * Generate commit message using Google Gemini API
 * @param {string} diff - Git diff statistics
 * @param {string} files - Changed file names
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<string|null>} - Generated commit message or null if failed
 */
async function generateWithGemini(diff, files, apiKey) {
    try {
        // Truncate diff if too long (Gemini has token limits, but generous)
        const maxDiffLength = 2000;
        const truncatedDiff = diff.length > maxDiffLength 
            ? diff.substring(0, maxDiffLength) + '... (truncated)'
            : diff;

        // Create prompt optimized for Gemini
        const prompt = `Analyze these git changes and generate a concise commit message following conventional commit format (<type>(<scope>): <subject>).

Changed files:
${files}

Changes:
${truncatedDiff}

Generate ONLY the commit message following this format: <type>(<scope>): <subject>
Do not include any explanation, reasoning, or additional text. Only output the commit message itself.

Examples:
- feat(dashboard): Add user analytics chart
- fix(sidebar): Resolve navigation routing issues
- refactor(api): Optimize database queries
- chore(deps): Update dependencies

Now generate the commit message for the changes above:`;

        console.log('🤖 Generating commit message with Google Gemini AI...');
        console.log('   Model: gemini-2.0-flash');

        // Call Gemini API (using gemini-2.0-flash model)
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 100,
                    topP: 0.8,
                    topK: 40
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            }
        );

        // Extract generated text from response
        let generatedText = '';
        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            generatedText = response.data.candidates[0].content.parts[0].text.trim();
        }

        if (!generatedText) {
            console.warn('⚠️  No response from Gemini API');
            return null;
        }

        // Clean up the response - extract just the commit message
        let commitMessage = generatedText.trim();
        
        // Remove quotes if wrapped in quotes
        commitMessage = commitMessage.replace(/^["']|["']$/g, '');

        // Extract the first line (commit message should be one line)
        commitMessage = commitMessage.split('\n')[0].trim();

        // Remove markdown code blocks if present
        commitMessage = commitMessage.replace(/^```[\w]*\n?|\n?```$/g, '').trim();

        // Remove "Commit message:" or similar prefixes
        commitMessage = commitMessage.replace(/^(commit message|message|commit):\s*/i, '').trim();

        // Validate the message is not empty
        if (!commitMessage || commitMessage.length < 3) {
            console.warn('⚠️  Generated commit message is too short or empty');
            return null;
        }

        // Validate it follows conventional commit format (basic check)
        if (!commitMessage.match(/^(feat|fix|chore|refactor|style|test|docs|perf|ci|build|revert)(\(.+\))?:/)) {
            // If it doesn't match, try to fix common issues
            if (commitMessage.match(/^[a-z]/)) {
                // Starts with lowercase, might just need format
                commitMessage = `feat: ${commitMessage}`;
            }
        }

        console.log(`✅ Gemini AI generated: "${commitMessage}"`);
        return commitMessage;

    } catch (error) {
        // Handle various error cases
        if (error.response) {
            // API error
            if (error.response.status === 400) {
                console.warn('⚠️  Invalid request to Gemini API (check API key and prompt)');
            } else if (error.response.status === 403) {
                console.warn('⚠️  Gemini API access denied (check API key and permissions)');
            } else if (error.response.status === 429) {
                console.warn('⚠️  Gemini API rate limit exceeded, please try again later');
            } else {
                console.warn(`⚠️  Gemini API error: ${error.response.status} - ${error.response.statusText}`);
            }
        } else if (error.code === 'ECONNABORTED') {
            console.warn('⚠️  Request timeout (Gemini API may be slow)');
        } else {
            console.warn(`⚠️  Gemini generation error: ${error.message}`);
        }
        return null;
    }
}

