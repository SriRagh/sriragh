import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IGNORE_DIRECTORIES = ['node_modules', 'dist', '.git', 'cypress', 'tools', 'public'];
const MAX_FILE_LINES = 300;
const OUTPUT_HTML = 'code-review-dashboard.html';

// Load Environment Variables
function loadEnv() {
    const envPaths = ['.env', '.env.local', '.env.dev'];
    for (const envFile of envPaths) {
        const fullPath = path.resolve(__dirname, '../../', envFile);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            content.split('\n').forEach(line => {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                }
            });
            break;
        }
    }
}

// HTTPS Request Helper (replaces fetch)
function request(urlStr, options = {}, bodyData = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(urlStr);
        const reqOpts = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = https.request(reqOpts, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    json: async () => {
                        try { return JSON.parse(data || '{}'); } catch (e) { return {}; }
                    }
                });
            });
        });

        req.on('error', (e) => reject(e));

        if (bodyData) {
            req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
        }
        req.end();
    });
}

// Security & Quality Patterns
const PATTERNS = [
    { id: 'XSS_RISK', regex: /dangerouslySetInnerHTML/g, message: 'Security Risk: usage of dangerouslySetInnerHTML.', severity: 'CRITICAL', type: 'SECURITY' },
    { id: 'HARDCODED_IP', regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, message: 'Security: Potential hardcoded IP address.', severity: 'HIGH', type: 'SECURITY' },
    { id: 'EVAL_USAGE', regex: /\beval\s*\(/g, message: 'Security: Usage of eval() is unsafe.', severity: 'CRITICAL', type: 'SECURITY' },
    { id: 'CONSOLE_LOG', regex: /console\.log\s*\(/g, message: 'Quality: Remove console.log in production.', severity: 'LOW', type: 'QUALITY' },
    { id: 'TODO_LEFT', regex: /\/\/\s*TODO/gi, message: 'Quality: Unresolved TODO found.', severity: 'LOW', type: 'QUALITY' },
    { id: 'INLINE_STYLE', regex: /style=\{\{/g, message: 'Quality: Avoid inline styles.', severity: 'LOW', type: 'QUALITY' },
    { id: 'MAGIC_NUMBER', regex: /(?<![:.\d])(500|1000|5000)\b(?!px)/g, message: 'Quality: Magic number detected.', severity: 'LOW', type: 'QUALITY' },
    { id: 'MISSING_ALT', regex: /<img\s+(?![^>]*alt=)[^>]*>/gi, message: 'Accessibility: Missing alt attribute.', severity: 'MEDIUM', type: 'ACCESSIBILITY' },
    { id: 'UNSAFE_KEY', regex: /key=\{index\}/g, message: 'Performance: Array index as key is unsafe.', severity: 'MEDIUM', type: 'REACT_PERF' }
];


// AI Analysis Helper
async function analyzeWithGemini(content, fileName) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return [];

    const prompt = `
    You are a senior software engineer conducting a code review. Analyze the following code for:
    1. Security Vulnerabilities (Critical)
    2. Logic Errors (High)
    3. Performance Issues (Medium)
    4. Code Quality/Best Practices (Low)

    File: ${fileName}

    Return ONLY a JSON array of objects with this format (no markdown, just raw JSON):
    [
        { "file": "${fileName}", "line": <line_number>, "severity": "CRITICAL|HIGH|MEDIUM|LOW", "message": "<concise_description>", "snippet": "<code_snippet>" }
    ]

    If no issues, return [].

    Code:
    ${content}
    `;

    try {
        const response = await request(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
            // Clean markdown if present
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } else {
            console.error('AI Request Failed:', response.status);
            return [];
        }
    } catch (e) {
        console.error('AI Analysis Error:', e);
        return [];
    }
}

async function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(path.resolve(__dirname, '../../'), filePath).replace(/\\/g, '/');
    let issues = [];

    // 1. Static Regex Analysis (Fast & Reliable baseline)
    const lines = content.split('\n');
    PATTERNS.forEach(pattern => {
        let match;
        pattern.regex.lastIndex = 0;
        while ((match = pattern.regex.exec(content)) !== null) {
            const lineIndex = content.substring(0, match.index).split('\n').length;
            issues.push({
                file: relativePath,
                line: lineIndex,
                id: pattern.id,
                message: pattern.message,
                severity: pattern.severity,
                snippet: lines[lineIndex - 1] ? lines[lineIndex - 1].trim() : ''
            });
        }
    });

    // 2. AI Analysis (Dynamic & Deep)
    if (process.env.GEMINI_API_KEY) {
        console.log(`🤖 Analyzing ${relativePath} with Gemini AI...`);
        const aiIssues = await analyzeWithGemini(content, relativePath);
        issues = [...issues, ...aiIssues];
    } else {
        console.log(`ℹ️ Skipping AI analysis for ${relativePath} (No API Key)`);
    }

    return issues;
}

// GitHub API Helpers
async function postGitHubPRReview(token, owner, repo, prNumber, issues, commitSha) {
    if (issues.length === 0) return;

    const comments = issues
        .filter(i => ['CRITICAL', 'HIGH', 'MEDIUM'].includes(i.severity))
        .map(i => ({
            path: i.file,
            line: i.line, // Ensure this line exists in diff, otherwise inline comment fails
            body: `**${i.severity}**: ${i.message}\n\`${i.snippet}\``
        }));

    if (comments.length === 0) return;

    console.log(`📡 Posting ${comments.length} inline comments to PR #${prNumber}...`);

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Code-Review-Bot',
        'Content-Type': 'application/json'
    };

    try {
        const body = {
            commit_id: commitSha,
            body: "🛡️ Automated Code Review found issues.",
            event: "REQUEST_CHANGES",
            comments: comments
        };

        const response = await request(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, {
            method: 'POST',
            headers
        }, body);

        if (response.ok) {
            console.log('✅ Review successfully posted.');
        } else {
            const err = await response.json();
            console.error('❌ Failed to post inline review:', JSON.stringify(err, null, 2));

            // Fallback: Post as a general comment
            console.log("⚠️ Falling back to general review comment...");

            const summary = comments.map(c => `- **${c.path}:${c.line}**\n${c.body}`).join('\n\n');
            const fallbackBody = {
                commit_id: commitSha,
                body: `🛡️ Automated Code Review found issues (General Fallback):\n\n${summary}`,
                event: "REQUEST_CHANGES"
            };

            const fallbackResponse = await request(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, {
                method: 'POST',
                headers
            }, fallbackBody);

            if (fallbackResponse.ok) {
                console.log('✅ Fallback review posted successfully.');
            } else {
                const fallbackErr = await fallbackResponse.json();
                console.error('❌ Failed to post fallback review:', JSON.stringify(fallbackErr, null, 2));
            }
        }
    } catch (e) {
        console.error('❌ Error posting review:', e);
    }
}

async function postGitHubStatus(state, description) {
    const token = process.env.GITHUB_TOKEN;
    const sha = process.env.GITHUB_SHA || getLocalCommitSha();
    const repoPathRaw = process.env.GITHUB_REPO || 'SriRagh/sriragh';

    if (!token || !sha) return;

    let [owner, repo] = repoPathRaw.split('/');
    if (repoPathRaw.includes('github.com')) {
        const parts = repoPathRaw.split('github.com/')[1].split('/');
        owner = parts[0];
        repo = parts[1].replace('.git', '');
    }

    console.log(`📡 Setting Status to [${state}]: ${description}`);
    try {
        await request(`https://api.github.com/repos/${owner}/${repo}/statuses/${sha}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Code-Review-Bot'
            }
        }, {
            state, description, context: 'Private Code Review Bot'
        });
    } catch (e) { console.error('Error posting status', e); }
}

async function run() {
    loadEnv();
    await postGitHubStatus('pending', 'Scanning code...');

    const rootDir = path.resolve(__dirname, '../../src');
    const files = [];

    function walk(dir) {
        if (IGNORE_DIRECTORIES.some(d => dir.includes(d))) return;
        try {
            fs.readdirSync(dir).forEach(f => {
                const full = path.join(dir, f);
                if (fs.statSync(full).isDirectory()) walk(full);
                else if (/\.(js|ts|tsx|jsx)$/.test(f)) files.push(full);
            });
        } catch { }
    }
    if (fs.existsSync(rootDir)) walk(rootDir);

    let allIssues = [];
    for (const f of files) {
        allIssues.push(...await scanFile(f));
    }

    // Generate Dashboard
    const html = `<html><body>
    <div class="summary">
        <div class="card"><div class="label">Total Issues</div><div class="value">${allIssues.length}</div></div>
    </div>
    </body></html>`;
    fs.writeFileSync(path.resolve(__dirname, '../../', OUTPUT_HTML), html);

    // GitHub Posting
    const token = process.env.GITHUB_TOKEN;
    const prNum = process.env.PR_NUMBER;
    const sha = process.env.GITHUB_SHA;
    const repoInfo = process.env.GITHUB_REPO || 'SriRagh/sriragh';
    let [owner, repo] = repoInfo.split('/');

    if (token && prNum && sha) {
        await postGitHubPRReview(token, owner, repo, prNum, allIssues, sha);
    }

    const criticalCount = allIssues.filter(i => ['CRITICAL', 'HIGH'].includes(i.severity)).length;
    await postGitHubStatus(criticalCount > 0 ? 'failure' : 'success', `Found ${criticalCount} critical issues.`);

    if (criticalCount > 0) process.exit(1);
}

function getLocalCommitSha() { try { return execSync('git rev-parse HEAD').toString().trim(); } catch { return null; } }

run().catch(console.error);
