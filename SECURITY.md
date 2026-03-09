# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| main    | ✅        |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue.

Instead, please report it by emailing the maintainer at:

📧 **[Use GitHub private vulnerability reporting](https://github.com/Ker102/StoryForge/security/advisories/new)**

We aim to acknowledge reports within **48 hours** and provide a fix within **7 days** for critical issues.

## Security Practices

- **Dependencies**: Automated via Dependabot (weekly updates)
- **Static analysis**: CodeQL scanning on every PR and weekly
- **Linting**: Ruff enforced via CI
- **Secrets**: Never committed — all API keys loaded from environment variables
- **CORS**: Restricted origins (not `*` in production)
- **Input validation**: Pydantic models validate all user input
- **Content safety**: Age-appropriate content filtering for all generated text/images
