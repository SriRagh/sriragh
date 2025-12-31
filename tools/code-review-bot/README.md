# Private Code Review Bot (POC)

This bot is designed to perform code reviews automatically on Pull Requests without exposing any source code to external AI services.

## How it works
1.  **Triggers on PR**: Runs whenever a new PR is created or updated.
2.  **Analyzes Local Diffs**: Scans the code using local static analysis engines.
3.  **No Data Leakage**: All analysis happens within the GitHub Runner or your self-hosted environment.
4.  **Feedback**: Posts review comments directly to the lines of code in the PR (via `reviewdog`).

## Features
- **Security Audit**: Scans for XSS (`dangerouslySetInnerHTML`), hardcoded credentials, IPs, and insecure protocols.
- **Code Quality**: Integrates with local ESLint and SonarJS rules.
- **Structure**: Checks for project-specific structural requirements.

## Privacy Guarantee
- **Zero API Calls**: No data is sent to OpenAI, Gemini, or any other LLM provider.
- **100% In-House**: Logic is entirely script-based and rule-based.

## How to run locally
From the project root directory:
```bash
node tools/code-review-bot/audit.js
```
