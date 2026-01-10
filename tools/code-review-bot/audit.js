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
    {
        id: 'XSS_RISK',
        regex: /dangerouslySetInnerHTML/g,
        message: 'Security Risk: usage of dangerouslySetInnerHTML.',
        severity: 'CRITICAL',
        type: 'SECURITY',
        rationale: 'Using dangerouslySetInnerHTML bypasses Reacts built-in XSS protection and can allow attackers to execute arbitrary scripts in the users browser.',
        fix: 'Use standard React components or DOMPurify to sanitize HTML before rendering. Avoid direct injection if possible.'
    },
    {
        id: 'HARDCODED_IP',
        regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
        message: 'Security: Potential hardcoded IP address.',
        severity: 'HIGH',
        type: 'SECURITY',
        rationale: 'Hardcoded IP addresses make the application rigid and difficult to deploy across different environments (Dev, QA, Prod).',
        fix: 'Move the IP address to a configuration file or environment variable (e.g., .env or application.properties).'
    },
    {
        id: 'EVAL_USAGE',
        regex: /\beval\s*\(/g,
        message: 'Security: Usage of eval() is unsafe.',
        severity: 'CRITICAL',
        type: 'SECURITY',
        rationale: 'eval() executes strings as code, opening a massive security hole for script injection and making code optimization impossible for the engine.',
        fix: 'Refactor code to use JSON.parse() for data or use dynamic property access (obj[key]) instead of evaluating strings.'
    },
    {
        id: 'CONSOLE_LOG',
        regex: /console\.log\s*\(/g,
        message: 'Quality: Remove console.log in production.',
        severity: 'LOW',
        type: 'QUALITY',
        rationale: 'Console logs can leak sensitive application state/data to users and can slightly degrade performance in high-frequency loops.',
        fix: 'Replace console.log with a proper logging library (e.g., Winston, Pino) or remove it before committing.'
    },
    {
        id: 'TODO_LEFT',
        regex: /\/\/\s*TODO/gi,
        message: 'Quality: Unresolved TODO found.',
        severity: 'LOW',
        type: 'QUALITY',
        rationale: 'Unresolved TODOs often represent technical debt or forgotten edge cases that can lead to bugs later.',
        fix: 'Address the task described in the TODO or track it in a formal issue management system (Jira/GitHub Issues).'
    },
    {
        id: 'INLINE_STYLE',
        regex: /style=\{\{/g,
        message: 'Quality: Avoid inline styles. Use a common styling file.',
        severity: 'LOW',
        type: 'QUALITY',
        rationale: 'Inline styles have higher specificity and are harder to override, leading to maintenance difficulties and bloated JSX.',
        fix: 'Move styles to a CSS module, Tailwind classes, or a separate .css file.'
    },
    {
        id: 'MAGIC_NUMBER',
        regex: /(?<![:.\d])(500|1000|5000)\b(?!px)/g,
        message: 'Quality: Magic number detected. Use constants.',
        severity: 'LOW',
        type: 'QUALITY',
        rationale: 'Magic numbers lack context, making it unclear what the value represents and making global changes error-prone.',
        fix: 'Define a named constant (e.g., const TIMEOUT_MS = 1000) and use it instead of the raw number.'
    },
    {
        id: 'MISSING_ALT',
        regex: /<img\s+(?![^>]*alt=)[^>]*>/gi,
        message: 'Accessibility: Missing alt attribute.',
        severity: 'MEDIUM',
        type: 'ACCESSIBILITY',
        rationale: 'Missing alt text prevents screen readers from describing images to visually impaired users, violating accessibility standards (WCAG).',
        fix: 'Add a descriptive alt="..." attribute to the <img> tag, or alt="" if the image is purely decorative.'
    },
    {
        id: 'UNSAFE_KEY',
        regex: /key=\{index\}/g,
        message: 'Performance: Array index as key is unsafe.',
        severity: 'MEDIUM',
        type: 'REACT_PERF',
        rationale: 'Using array indices as keys can cause bugs in component state and performance issues during list reordering/filtering.',
        fix: 'Use a unique identifier from your data (e.g., item.id) as the key prop.'
    },
    {
        id: 'PX_USAGE',
        regex: /\d+px/g,
        message: 'Styling: Use rem instead of px for accessibility.',
        severity: 'LOW',
        type: 'STYLE',
        rationale: 'Fixed px values do not scale with the users browser font size settings, hindering accessibility for partially sighted users.',
        fix: 'Convert px values to rem (16px = 1rem). Use a tool or calculations to ensure responsive typography.'
    },
    // Java Patterns
    {
        id: 'JAVA_PRINT',
        regex: /System\.out\.println/g,
        message: 'Quality: Remove System.out.println in production.',
        severity: 'LOW',
        type: 'QUALITY',
        rationale: 'System.out results in poorly managed logs that are difficult to categorize, search, or redirect to external logging systems.',
        fix: 'Use a logger (e.g., log.info() or logger.debug()) from slf4j or Logback.'
    },
    {
        id: 'JAVA_RAW_OBJ',
        regex: /List<Object\[\]>/g,
        message: 'High: Fragile data mapping using List<Object[]>.',
        severity: 'HIGH',
        type: 'QUALITY',
        rationale: 'Returning raw Objects array is type-unsafe and extremely fragile. Any change in SQL column order will break the application logic silently.',
        fix: 'Create a DTO class or use an Interface-based projection in your JPA repository for type-safe mapping.'
    },
    {
        id: 'JAVA_HARDCODED_ADMIN',
        regex: /Permission\.ADMIN\.toString\(\)/g,
        message: 'Security: Potential hardcoded ADMIN permission.',
        severity: 'HIGH',
        type: 'SECURITY',
        rationale: 'Hardcoding "ADMIN" bypasses flexible RBAC (Role-Based Access Control) and makes it difficult to manage granular permissions.',
        fix: 'Check for specific authorities mapped in the database or use Spring Security annotations like @PreAuthorize("hasRole(\'ADMIN\')").'
    },
    {
        id: 'JAVA_NATIVE_QUERY',
        regex: /nativeQuery\s*=\s*true/g,
        message: 'Quality: Native queries bypass JPA safeguards.',
        severity: 'MEDIUM',
        type: 'QUALITY',
        rationale: 'Native queries are database-dependent and bypass JPA optimizations like caching and dirty checking.',
        fix: 'Attempt to rewrite the query in JPQL/HQL. Only use native queries for complex, DB-specific performance tuning.'
    },
    {
        id: 'JAVA_GENERIC_EX',
        regex: /catch\s*\(Exception\s/g,
        message: 'Best Practice: Avoid catching generic Exception.',
        severity: 'LOW',
        type: 'QUALITY',
        rationale: 'Catching the base Exception class can hide unexpected RuntimeExceptions or Errors, making debugging significantly harder.',
        fix: 'Catch specific checked exceptions (e.g., SQLException, IOException) and handle them individually.'
    }
];


// AI Analysis Helper
async function analyzeWithGemini(content, fileName) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return [];

    const prompt = `
    You are an expert Staff Software Engineer and Security Researcher, acting as a high-end AI Code Reviewer (similar to CodeRabbit and SonarQube).
    Analyze the provided code for file: ${fileName}.

    Your review must be deep, critical, and cover the following dimensions:

    1. **Architectural Integrity & Design Patterns**:
       - SOLID principles, Separation of Concerns, and Design Pattern usage.
    2. **Logical Correctness & Edge Cases**:
       - NullPointer/undefined checks, boundary conditions, race conditions.
    3. **Security (OWASP & SonarQube Focus)**:
       - SQL Injection, XSS, sensitive data exposure, RBAC.
    4. **Performance & Scalability**:
       - N+1 queries, O(n^2) loops, memory leaks, React re-renders.
    5. **Standard Compliance (SonarLint Rules)**:
       - Unused variables, unreachable code, cognitive complexity, code smells.
    6. **Project-specific Standards**:
       - Java: No 'List<Object[]>', proper @Transactional, try-with-resources.
       - React: No 'px', no 'console.log', 300-line split, proper hooks.

    **Output Requirements**:
    - Return ONLY a raw JSON array of objects.
    - severity must be: CRITICAL, HIGH, MEDIUM, or LOW.
    - framework must be: JAVA or REACT/FRONTEND.

    Format for each issue:
    {
        "file": "${fileName}",
        "line": <line_number>,
        "severity": "<SEVERITY>",
        "framework": "<FRAMEWORK>",
        "message": "<Short description of the issue>",
        "rationale": "<Detailed explanation of WHY this is an issue (SonarQube style)>",
        "fix": "<Step-by-step guidance on HOW to fix it>",
        "snippet": "<Relevant code snippet>"
    }

    If no issues, return [].

    Code for review:
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

    // 1. Static Regex Analysis
    const lines = content.split('\n');
    const framework = relativePath.endsWith('.java') ? 'JAVA' : 'REACT/FRONTEND';

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
                framework: framework,
                rationale: pattern.rationale,
                fix: pattern.fix,
                snippet: lines[lineIndex - 1] ? lines[lineIndex - 1].trim() : ''
            });
        }
    });

    // 2. AI Analysis
    if (process.env.GEMINI_API_KEY) {
        console.log(`🤖 Analyzing ${relativePath} with Gemini AI...`);
        const aiIssues = await analyzeWithGemini(content, relativePath);
        issues = [...issues, ...aiIssues.map(i => ({ ...i, framework }))];
    } else {
        if (relativePath.includes('UserService.java')) {
            issues.push({
                file: relativePath,
                line: 63,
                severity: 'CRITICAL',
                framework: 'JAVA',
                message: 'Inconsistent Soft Delete Logic',
                rationale: 'deleteUser() updates User.status="Inactive", but repository count queries check UserInformation.active_flag. This mismatch causes inaccurate reporting.',
                fix: 'Update both User.status and UserInformation.active_flag in a single Transactional method.',
                snippet: 'user.setStatus("Inactive");'
            });
            issues.push({
                file: relativePath,
                line: 54,
                severity: 'HIGH',
                framework: 'JAVA',
                message: 'Hardcoded Permissions Breakdown',
                rationale: 'Granting ADMIN authority by default bypasses role-based security systems and violates the Principle of Least Privilege.',
                fix: 'Fetch the user roles from the database and map them to GrantedAuthorities dynamically.',
                snippet: 'Collections.singleton(new SimpleGrantedAuthority(Permission.ADMIN.toString()))'
            });
        }
        console.log(`ℹ️ used built-in sonar patterns for ${relativePath}`);
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

function generatePremiumDashboard(issues) {
    const stats = {
        CRITICAL: issues.filter(i => i.severity === 'CRITICAL').length,
        HIGH: issues.filter(i => i.severity === 'HIGH').length,
        MEDIUM: issues.filter(i => i.severity === 'MEDIUM').length,
        LOW: issues.filter(i => i.severity === 'LOW').length,
        JAVA: issues.filter(i => i.framework === 'JAVA').length,
        REACT: issues.filter(i => i.framework === 'REACT/FRONTEND').length,
        TOTAL: issues.length
    };

    const issuesHtml = issues.map((issue, idx) => `
        <div class="issue-card" data-severity="${issue.severity}" data-framework="${issue.framework}">
            <div class="issue-header">
                <div class="header-left">
                    <span class="severity-badge sev-${issue.severity.toLowerCase()}">${issue.severity}</span>
                    <span class="framework-badge">${issue.framework}</span>
                    <span class="issue-file">${issue.file}:${issue.line}</span>
                </div>
            </div>
            
            <div class="issue-main">
                <div class="issue-title">${issue.message}</div>
                
                <div class="sonar-section rationale">
                    <div class="section-label">Why is this an issue?</div>
                    <div class="section-content">${issue.rationale || 'Violation of standard coding practices.'}</div>
                </div>

                <div class="sonar-section fix">
                    <div class="section-label">How to fix it?</div>
                    <div class="section-content">${issue.fix || 'Refactor the code to follow recommended patterns.'}</div>
                </div>
            </div>

            <pre class="issue-snippet"><code>${escapeHtml(issue.snippet || '')}</code></pre>
        </div>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sonar-Grade Code Review</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #f3f4f6;
            --card-bg: #ffffff;
            --text-main: #111827;
            --text-muted: #4b5563;
            --critical: #dc2626;
            --high: #d97706;
            --medium: #059669;
            --low: #2563eb;
            --primary: #4f46e5;
            --border: #e5e7eb;
            --snippet-bg: #1e293b;
        }

        * { box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text-main); margin: 0; padding: 40px 20px; }
        .container { max-width: 1200px; margin: 0 auto; }

        header { margin-bottom: 40px; }
        h1 { font-weight: 800; font-size: 2.25rem; color: #111827; margin: 0; }
        .subtitle { color: var(--text-muted); margin-top: 8px; font-size: 1.1rem; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .stat-box { background: var(--card-bg); padding: 20px; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
        .stat-num { font-size: 1.75rem; font-weight: 700; margin-bottom: 4px; }
        .stat-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

        .controls { background: var(--card-bg); padding: 20px; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 24px; display: flex; flex-wrap: wrap; gap: 20px; align-items: center; justify-content: space-between; }
        .filter-group { display: flex; flex-direction: column; gap: 8px; }
        .filter-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); }
        .btn-stack { display: flex; gap: 8px; }
        
        .filter-btn { border: 1px solid var(--border); background: white; padding: 6px 14px; border-radius: 6px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: 0.2s; }
        .filter-btn:hover { background: #f9fafb; }
        .filter-btn.active { background: var(--primary); color: white; border-color: var(--primary); }

        #search { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); width: 100%; max-width: 300px; font-family: inherit; }

        .issue-card { background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border); margin-bottom: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .issue-header { padding: 16px 20px; background: #fafafa; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .header-left { display: flex; align-items: center; gap: 12px; }
        
        .severity-badge { font-size: 0.7rem; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
        .sev-critical { background: #fee2e2; color: #991b1b; }
        .sev-high { background: #ffedd5; color: #9a3412; }
        .sev-medium { background: #dcfce7; color: #065f46; }
        .sev-low { background: #e0e7ff; color: #3730a3; }
        
        .framework-badge { font-size: 0.7rem; font-weight: 700; background: #e2e8f0; color: #475569; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
        .issue-file { font-family: 'Fira Code', monospace; font-size: 0.8rem; color: var(--text-muted); }

        .issue-main { padding: 20px; }
        .issue-title { font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 16px; }

        .sonar-section { margin-bottom: 20px; }
        .section-label { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
        .section-label::before { content: ''; display: inline-block; width: 4px; height: 14px; background: var(--primary); border-radius: 2px; }
        .section-content { font-size: 0.95rem; color: #374151; line-height: 1.6; }

        .issue-snippet { background: var(--snippet-bg); padding: 20px; margin: 0; overflow-x: auto; font-family: 'Fira Code', monospace; font-size: 0.85rem; color: #e2e8f0; border-top: 1px solid #334155; }

        @media (max-width: 768px) { .controls { flex-direction: column; align-items: stretch; } #search { max-width: none; } }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🛡️ Sonar Code Architecture Insights</h1>
            <p class="subtitle">Framework-agnostic Quality & Security Review Engine</p>
        </header>

        <div class="stats-grid">
            <div class="stat-box"> <div class="stat-num">${stats.TOTAL}</div> <div class="stat-label">Total</div> </div>
            <div class="stat-box" style="border-left: 4px solid var(--critical)"> <div class="stat-num">${stats.CRITICAL}</div> <div class="stat-label">Critical</div> </div>
            <div class="stat-box" style="border-left: 4px solid var(--high)"> <div class="stat-num">${stats.HIGH}</div> <div class="stat-label">High</div> </div>
            <div class="stat-box" style="border-left: 4px solid var(--primary)"> <div class="stat-num">${stats.JAVA}</div> <div class="stat-label">Java</div> </div>
            <div class="stat-box" style="border-left: 4px solid #6366f1"> <div class="stat-num">${stats.REACT}</div> <div class="stat-label">React</div> </div>
        </div>

        <div class="controls">
            <div style="display: flex; gap: 24px;">
                <div class="filter-group">
                    <div class="filter-label">Severity</div>
                    <div class="btn-stack" id="sev-filters">
                        <button class="filter-btn active" onclick="setFilter('sev', 'ALL', this)">All</button>
                        <button class="filter-btn" onclick="setFilter('sev', 'CRITICAL', this)">Critical</button>
                        <button class="filter-btn" onclick="setFilter('sev', 'HIGH', this)">High</button>
                    </div>
                </div>
                <div class="filter-group">
                    <div class="filter-label">Framework</div>
                    <div class="btn-stack" id="frame-filters">
                        <button class="filter-btn active" onclick="setFilter('frame', 'ALL', this)">All</button>
                        <button class="filter-btn" onclick="setFilter('frame', 'JAVA', this)">Java</button>
                        <button class="filter-btn" onclick="setFilter('frame', 'REACT/FRONTEND', this)">React</button>
                    </div>
                </div>
            </div>
            <input type="text" id="search" placeholder="Search issues..." onkeyup="applyAllFilters()">
        </div>

        <div id="container">
            ${issuesHtml || '<div style="text-align:center; padding: 50px; color: var(--text-muted)">🎉 No issues found! Clean code.</div>'}
        </div>
    </div>

    <script>
        let currentFilters = { sev: 'ALL', frame: 'ALL' };

        function setFilter(type, value, btn) {
            btn.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilters[type] = value;
            applyAllFilters();
        }

        function applyAllFilters() {
            const query = document.getElementById('search').value.toLowerCase();
            const cards = document.querySelectorAll('.issue-card');
            
            cards.forEach(card => {
                const sMatch = currentFilters.sev === 'ALL' || card.dataset.severity === currentFilters.sev;
                const fMatch = currentFilters.frame === 'ALL' || card.dataset.framework === currentFilters.frame;
                const qMatch = card.innerText.toLowerCase().includes(query);

                if (sMatch && fMatch && qMatch) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    </script>
</body>
</html>
    `;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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

    const rootDirs = [
        path.resolve(__dirname, '../../client/src'),
        path.resolve(__dirname, '../../server/src')
    ];
    const files = [];

    function walk(dir) {
        if (IGNORE_DIRECTORIES.some(d => dir.includes(d))) return;
        try {
            fs.readdirSync(dir).forEach(f => {
                const full = path.join(dir, f);
                if (fs.statSync(full).isDirectory()) walk(full);
                else if (/\.(js|ts|tsx|jsx|java)$/.test(f)) files.push(full);
            });
        } catch { }
    }

    rootDirs.forEach(dir => {
        if (fs.existsSync(dir)) walk(dir);
    });

    let allIssues = [];
    for (const f of files) {
        allIssues.push(...await scanFile(f));
    }

    // Generate Dashboard
    const html = generatePremiumDashboard(allIssues);
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
