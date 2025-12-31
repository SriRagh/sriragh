import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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

async function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    const fileName = path.basename(filePath);
    const relativePath = path.relative(path.resolve(__dirname, '../../'), filePath).replace(/\\/g, '/');

    PATTERNS.forEach(pattern => {
        let match;
        pattern.regex.lastIndex = 0;
        while ((match = pattern.regex.exec(content)) !== null) {
            const lineIndex = content.substring(0, match.index).split('\n').length;
            issues.push({
                file: relativePath, // Use relative path for GitHub API
                line: lineIndex,
                id: pattern.id,
                message: pattern.message,
                severity: pattern.severity,
                snippet: lines[lineIndex - 1].trim()
            });
        }
    });

    return issues;
}

// GitHub API Helpers
async function postGitHubPRReview(token, owner, repo, prNumber, issues, commitSha) {
    if (issues.length === 0) return;

    // Filter only critical/high/medium for comments to avoid spam
    const comments = issues
        .filter(i => ['CRITICAL', 'HIGH', 'MEDIUM'].includes(i.severity))
        .map(i => ({
            path: i.file,
            line: i.line,
            body: `**${i.severity}**: ${i.message}\n\`${i.snippet}\``
        }));

    if (comments.length === 0) return;

    console.log(`📡 Posting ${comments.length} inline comments to PR #${prNumber}...`);

    // We start a REVIEW with comments
    // Note: 'line' requires the file to be part of the diff. If the file wasn't changed, this might error.
    // robust bot would check the diff first. For this POC, we try-catch.

    try {
        const body = {
            commit_id: commitSha,
            body: "🛡️ Automated Code Review found issues.",
            event: "REQUEST_CHANGES",
            comments: comments
        };

        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Code-Review-Bot',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            console.log('✅ Review successfully posted.');
        } else {
            const err = await response.json();
            console.error('❌ Failed to post review:', JSON.stringify(err, null, 2));
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
    // Handle cases where GITHUB_REPO includes 'github.com' or .git
    if (repoPathRaw.includes('github.com')) {
        const parts = repoPathRaw.split('github.com/')[1].split('/');
        owner = parts[0];
        repo = parts[1].replace('.git', '');
    }

    console.log(`📡 Setting Status to [${state}]: ${description}`);
    try {
        await fetch(`https://api.github.com/repos/${owner}/${repo}/statuses/${sha}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Code-Review-Bot'
            },
            body: JSON.stringify({
                state, description, context: 'Private Code Review Bot'
            })
        });
    } catch (e) { /* Ignore */ }
}

async function run() {
    loadEnv();
    await postGitHubStatus('pending', 'Scanning code...');

    const rootDir = path.resolve(__dirname, '../../src');
    const files = [];

    // Recursive Walk
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

    // Generate Dashboard (Simplified)
    const html = `<html><body><h1>Issues Found: ${allIssues.length}</h1></body></html>`;
    fs.writeFileSync(path.resolve(__dirname, '../../', OUTPUT_HTML), html);

    // Logic for GitHub Posting
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
