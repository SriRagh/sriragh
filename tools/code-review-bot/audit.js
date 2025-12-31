import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IGNORE_DIRECTORIES = ['node_modules', 'dist', '.git', 'cypress', 'tools', 'public'];
const MAX_FILE_LINES = 300;
const OUTPUT_HTML = 'code-review-dashboard.html';

// Load Environment Variables manually (no dependencies)
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
            console.log(`ðŸ“ Loaded environment from ${envFile}`);
            break;
        }
    }
}

// Security & Quality Patterns
const PATTERNS = [
    {
        id: 'XSS_DANGEROUSLY_SET_INNER_HTML',
        regex: /dangerouslySetInnerHTML/g,
        message: 'Potential XSS: Avoid using dangerouslySetInnerHTML. Ensure content is sanitized.',
        severity: 'CRITICAL',
        type: 'SECURITY'
    },
    {
        id: 'HARDCODED_IP',
        regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
        message: 'Security: Potential hardcoded IP address found. Use environment variables.',
        severity: 'HIGH',
        type: 'SECURITY'
    },
    {
        id: 'EVAL_USAGE',
        regex: /\beval\s*\(/g,
        message: 'Security: Usage of eval() is highly discouraged.',
        severity: 'CRITICAL',
        type: 'SECURITY'
    },
    {
        id: 'CONSOLE_LOG',
        regex: /console\.log\s*\(/g,
        message: 'Quality: Remove console.log statements from production code.',
        severity: 'LOW',
        type: 'QUALITY'
    },
    {
        id: 'TODO_LEFT',
        regex: /\/\/\s*TODO/gi,
        message: 'Quality: Unresolved TODO found. Please address or track in backlog.',
        severity: 'LOW',
        type: 'QUALITY'
    },
    {
        id: 'DEEP_NESTING',
        regex: /^[ \t]*if.*\{[^{}]*\{[^{}]*\{[^{}]*\{/gm,
        message: 'Quality: Deeply nested logic detected (4+ levels). Consider refactoring for better readability.',
        severity: 'MEDIUM',
        type: 'QUALITY'
    },
    {
        id: 'MISSING_I18N',
        regex: />[^<{}>]{20,}</g, // Looks for long text between tags that might need translation
        message: 'Standard: Long hardcoded string found in JSX. Consider using i18n translation keys.',
        severity: 'LOW',
        type: 'STANDARD'
    },
    {
        id: 'INLINE_STYLE',
        regex: /style=\{\{/g,
        message: 'Quality: Inline styling used. Standardize by using Styled Components or CSS classes.',
        severity: 'LOW',
        type: 'QUALITY'
    },
    {
        id: 'TS_ANY',
        regex: /:\s*any\b/g,
        message: 'Standard: Avoid using "any". Use specific interfaces or "unknown" for better type safety.',
        severity: 'HIGH',
        type: 'QUALITY'
    },
    {
        id: 'MISSING_ALT',
        regex: /<img\s+(?![^>]*alt=)[^>]*>/gi,
        message: 'Accessibility: <img> tag is missing an "alt" attribute.',
        severity: 'MEDIUM',
        type: 'ACCESSIBILITY'
    },
    {
        id: 'MAGIC_NUMBERS',
        regex: /(?<![:.\d])(100|500|1000|5000|10000|60000)\b(?!px|%|vh|vw|rem|em)/g,
        message: 'Quality: Possible magic number detected. Use named constants for timeouts or limits.',
        severity: 'LOW',
        type: 'QUALITY'
    },
    {
        id: 'ASYNC_MISSING_TRY_CATCH',
        regex: /async\s+.*\{(?![^}]*try\s*\{)/gs,
        message: 'Stability: Async function detected without a try/catch block. Ensure error handling is implemented.',
        severity: 'HIGH',
        type: 'STABILITY'
    },
    {
        id: 'COMMENTED_CODE',
        regex: /\/\/[^!\n]*\n\/\/[^!\n]*\n\/\/[^!\n]*\n\/\/[^!\n]*/g,
        message: 'Quality: Large block of commented-out code detected. Please delete dead code.',
        severity: 'LOW',
        type: 'QUALITY'
    },
    {
        id: 'UNSAFE_KEY_INDEX',
        regex: /\.map\s*\(\s*\(\s*\w+\s*,\s*index\s*\)\s*=>\s*.*key=\{index\}/g,
        message: 'Performance: Using array index as a React key can cause rendering issues. Use a unique ID instead.',
        severity: 'MEDIUM',
        type: 'REACT_PERF'
    },
    {
        id: 'MISSING_HOOK_DEPS',
        regex: /(?:useEffect|useCallback|useMemo)\s*\(\s*(?:\(\s*\)\s*=>|function\s*\(\s*\))\s*\{[^}]*\}(?!\s*,\s*\[)/gs,
        message: 'Stability: React hook is missing its dependency array. It will run on every render.',
        severity: 'HIGH',
        type: 'REACT_STABILITY'
    }
];

// Naming Convention Regex
const CAMEL_CASE_VAR = /(?:const|let|var)\s+([a-z][a-zA-Z0-9]*)\s*=/g;
const PASCAL_CASE_COMP = /(?:const|function)\s+([A-Z][a-zA-Z0-9]*)\s*[=(]/g;
const SNAKE_CASE_INTERNAL = /(?:const|let|var)\s+([a-z0-9]+_[a-zA-Z0-9_]*)\s*=/g; // Only flags lowercase snake_case in declarations
const UPPER_SNAKE_CASE_OK = /^[A-Z0-9_]+$/; // Constants are fine

async function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    const fileName = path.basename(filePath);

    // 1. Pattern Matching (Security & General Quality)
    PATTERNS.forEach(pattern => {
        let match;
        pattern.regex.lastIndex = 0;
        while ((match = pattern.regex.exec(content)) !== null) {
            const lineIndex = content.substring(0, match.index).split('\n').length;
            issues.push({
                file: filePath,
                line: lineIndex,
                id: pattern.id,
                message: pattern.message,
                severity: pattern.severity,
                type: pattern.type,
                snippet: lines[lineIndex - 1].trim()
            });
        }
    });

    // 2. Smart Naming Conventions
    // We only flag lowercase snake_case in local variable declarations.
    // We IGNORE: UPPER_SNAKE_CASE (constants), PascalCase (components), and object property access.
    let snakeMatch;
    SNAKE_CASE_INTERNAL.lastIndex = 0;
    while ((snakeMatch = SNAKE_CASE_INTERNAL.exec(content)) !== null) {
        const varName = snakeMatch[1];

        // Ignore if it's all uppercase (a legitimate constant)
        if (UPPER_SNAKE_CASE_OK.test(varName)) continue;

        const lineIndex = content.substring(0, snakeMatch.index).split('\n').length;
        issues.push({
            file: filePath,
            line: lineIndex,
            id: 'NAMING_CONVENTION',
            message: `Quality: Internal variable "${varName}" should use camelCase. (Constants should be ALL_CAPS, variables should be camelCase).`,
            severity: 'MEDIUM',
            type: 'STANDARD',
            snippet: lines[lineIndex - 1].trim()
        });
    }

    // 3. File Size Quality
    if (lines.length > MAX_FILE_LINES) {
        issues.push({
            file: filePath,
            line: 1,
            id: 'LARGE_FILE',
            message: `Quality: File is too large (${lines.length} lines). Consider breaking it into smaller components.`,
            severity: 'MEDIUM',
            type: 'QUALITY',
            snippet: `File length: ${lines.length}`
        });
    }

    // 4. Test Case Check
    if (!filePath.includes('.test.') && !filePath.includes('.spec.') && !filePath.includes('demoData')) {
        const testDir = path.resolve(__dirname, '../../test');
        const relativePath = path.relative(path.resolve(__dirname, '../../src'), filePath);
        const testFilePath = path.join(testDir, relativePath.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1'));

        // Check if test file exists either in same dir or in test/ folder
        const localTestPath = filePath.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1');

        if (!fs.existsSync(testFilePath) && !fs.existsSync(localTestPath)) {
            issues.push({
                file: filePath,
                line: 0,
                id: 'MISSING_TEST',
                message: `Testing: No corresponding test file found for "${fileName}".`,
                severity: 'HIGH',
                type: 'TESTING',
                snippet: 'N/A'
            });
        }
    }

    return issues;
}

async function run() {
    loadEnv();
    const rootDir = path.resolve(__dirname, '../../src');
    console.log('ðŸ¤– Private AI Review Bot v2.0 - Deep Scanning Started...');
    console.log(`ðŸ“‚ Target: ${rootDir}\n`);

    const files = [];
    function walk(dir) {
        if (IGNORE_DIRECTORIES.some(d => dir.includes(d))) return;
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat && stat.isDirectory()) {
                walk(fullPath);
            } else if (/\.(js|ts|tsx|jsx)$/.test(file)) {
                files.push(fullPath);
            }
        });
    }

    walk(rootDir);

    let totalIssues = 0;
    const allIssues = [];

    for (const file of files) {
        const issues = await scanFile(file);
        if (issues.length > 0) {
            allIssues.push(...issues);
            totalIssues += issues.length;
        }
    }

    // Sort issues by severity
    const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    generateDashboard(allIssues, totalIssues);

    console.log(`\nâœ… Review Complete. Dashboard generated: ${OUTPUT_HTML}`);
    if (totalIssues > 0) {
        const criticals = allIssues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;
        if (criticals > 0) {
            console.log(`âŒ Found ${criticals} critical/high issues. PR status: FAILED`);
        } else {
            console.log(`âš ï¸ Found ${totalIssues} minor issues. PR status: WARNING`);
        }
    }

    // --- NEW: GitHub Status Integration ---
    const commitSha = process.env.GITHUB_SHA || getLocalCommitSha();
    const prNumber = process.env.PR_NUMBER;
    const githubToken = process.env.GITHUB_TOKEN;

    if (githubToken && commitSha) {
        await reportStatusToGitHub(githubToken, commitSha, totalIssues, allIssues);
    } else {
        console.log('\nðŸ’¡ Tip: To block the PR merge in GitHub, run with GITHUB_TOKEN and PR_NUMBER.');
        console.log('   Example: $env:GITHUB_TOKEN="..."; $env:PR_NUMBER="123"; node tools/code-review-bot/audit.js');
    }

    // Exit with error code if critical issues exist, so CI fails
    const criticalCount = allIssues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;
    if (criticalCount > 0) {
        process.exit(1);
    }
}

function getLocalCommitSha() {
    try {
        return execSync('git rev-parse HEAD').toString().trim();
    } catch (e) {
        return null;
    }
}

async function reportStatusToGitHub(token, sha, total, issues) {
    const criticals = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;
    const state = criticals > 0 ? 'failure' : 'success';
    const description = criticals > 0
        ? `Review Failed: ${criticals} critical/high issues found.`
        : `Review Passed: ${total} minor issues found.`;

    let repoPath = (process.env.GITHUB_REPO || 'SriRagh/sriragh').trim();
    if (repoPath.includes(':')) repoPath = repoPath.split(':').pop().replace('.git', '');
    if (repoPath.startsWith('http')) repoPath = repoPath.split('github.com/').pop().replace('.git', '');

    console.log(`ðŸ“¡ Reporting ${state} status to GitHub repo [${repoPath}] for commit ${sha.substring(0, 7)}...`);

    // Using native fetch/https to keep it zero-dependency
    try {
        const response = await fetch(`https://api.github.com/repos/${repoPath}/statuses/${sha}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'Private-Code-Review-Bot'
            },
            body: JSON.stringify({
                state: state,
                description: description,
                context: 'Private Code Review Bot',
                target_url: '' // You could host the dashboard and link it here
            })
        });

        if (response.ok) {
            console.log('âœ… Status successfully posted to GitHub.');
        } else {
            const err = await response.json();
            console.error('âŒ GitHub API Error:', JSON.stringify(err, null, 2));
            if (response.status === 404) {
                console.log('ðŸ’¡ Tip: A 404 usually means your token lacks SSO authorization.');
                console.log('   Go to GitHub Token Settings and click "Authorize" next to your organization.');
            }
        }
    } catch (error) {
        console.error('âŒ Error calling GitHub API:', error);
    }
}

function generateDashboard(issues, total) {
    const stats = {
        CRITICAL: issues.filter(i => i.severity === 'CRITICAL').length,
        HIGH: issues.filter(i => i.severity === 'HIGH').length,
        MEDIUM: issues.filter(i => i.severity === 'MEDIUM').length,
        LOW: issues.filter(i => i.severity === 'LOW').length
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Private Code Review Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0f172a;
            --card-bg: #1e293b;
            --text: #f1f5f9;
            --critical: #ef4444;
            --high: #f97316;
            --medium: #eab308;
            --low: #3b82f6;
            --border: #334155;
        }
        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 40px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
        }
        h1 { margin: 0; font-size: 2rem; }
        .stats-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: var(--card-bg);
            padding: 24px;
            border-radius: 12px;
            border: 1px solid var(--border);
            text-align: center;
        }
        .stat-card h3 { margin: 0; font-size: 0.9rem; color: #94a3b8; text-transform: uppercase; }
        .stat-card .value { font-size: 2.5rem; font-weight: 700; margin: 10px 0; }
        .stat-card.critical .value { color: var(--critical); }
        .stat-card.high .value { color: var(--high); }
        .stat-card.medium .value { color: var(--medium); }
        .stat-card.low .value { color: var(--low); }

        .issue-list {
            background: var(--card-bg);
            border-radius: 12px;
            border: 1px solid var(--border);
            overflow: hidden;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }
        th { background: #334155; padding: 15px; font-size: 0.85rem; text-transform: uppercase; }
        td { padding: 15px; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
        tr:hover { background: #1e293b; }
        .severity-badge {
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .bg-critical { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
        .bg-high { background: rgba(249, 115, 22, 0.2); color: #fdba74; }
        .bg-medium { background: rgba(234, 179, 8, 0.2); color: #fde047; }
        .bg-low { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
        
        .code-snippet {
            font-family: monospace;
            background: #000;
            padding: 10px;
            border-radius: 4px;
            margin-top: 5px;
            display: block;
            white-space: pre-wrap;
            color: #10b981;
        }
        .file-path { color: #94a3b8; font-size: 0.8rem; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ðŸ›¡ï¸ Private Code Review Dashboard</h1>
        <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
    </div>

    <div class="stats-container">
        <div class="stat-card critical">
            <h3>Critical</h3>
            <div class="value">${stats.CRITICAL}</div>
        </div>
        <div class="stat-card high">
            <h3>High</h3>
            <div class="value">${stats.HIGH}</div>
        </div>
        <div class="stat-card medium">
            <h3>Medium</h3>
            <div class="value">${stats.MEDIUM}</div>
        </div>
        <div class="stat-card low">
            <h3>Low</h3>
            <div class="value">${stats.LOW}</div>
        </div>
    </div>

    <div class="issue-list">
        <table>
            <thead>
                <tr>
                    <th>Severity</th>
                    <th>Type</th>
                    <th>File & Issue</th>
                </tr>
            </thead>
            <tbody>
                ${issues.map(i => `
                <tr>
                    <td><span class="severity-badge bg-${i.severity.toLowerCase()}">${i.severity}</span></td>
                    <td style="color: #94a3b8; font-weight: 600;">${i.type}</td>
                    <td>
                        <div style="font-weight: 600;">${i.id}: ${i.message}</div>
                        <div class="file-path">${path.relative(path.resolve(__dirname, '../../'), i.file)}:${i.line}</div>
                        ${i.snippet !== 'N/A' ? `<code class="code-snippet">${i.snippet.replace(/</g, '&lt;')}</code>` : ''}
                    </td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>
  `;
    fs.writeFileSync(path.resolve(__dirname, '../../', OUTPUT_HTML), html);
}

run().catch(err => {
    console.error('Bot Error:', err);
    process.exit(1);
});
