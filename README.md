# npm-package-tester

[![npm version](https://badge.fury.io/js/%40ashish.yd%2Fnpm-package-tester.svg)](https://www.npmjs.com/package/@ashish.yd/npm-package-tester)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ashishyd/npm-package-tester/pulls)
[![GitHub issues](https://img.shields.io/github/issues/ashishyd/npm-package-tester.svg)](https://github.com/ashishyd/npm-package-tester/issues)
[![GitHub stars](https://img.shields.io/github/stars/ashishyd/npm-package-tester.svg?style=social)](https://github.com/ashishyd/npm-package-tester)

🧪 **Automatically test npm packages by discovering their CLI commands and running them in isolated Docker environments**

🤖 **AI-Powered**: Generate realistic test scenarios using Claude, GPT-4, Gemini, or Groq
🔐 **Private Packages**: Full support for private npm packages and custom registries
⚡ **Fast & Reliable**: Run tests in parallel across multiple Node versions

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Features](#features)
- [Quick Start](#quick-start)
- [Example Output](#example-output)
- [AI-Powered Testing](#ai-powered-testing)
- [Testing Private Packages](#testing-private-packages)
- [CLI Options](#cli-options)
- [How It Works](#how-it-works)
- [Use Cases](#use-cases)
- [Configuration](#configuration)
- [API Usage](#api-usage)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Contributing](#contributing)
- [License](#license)

---

## The Problem

When you publish an npm package with CLI commands, you need to verify:
- ✅ Does it install correctly?
- ✅ Do all CLI commands work?
- ✅ Does it work across different Node versions?
- ✅ Does the --help flag work?
- ✅ Does the --version flag work?
- ✅ Does it run without crashing?

**Manual testing is tedious and error-prone.**

## The Solution

`npm-package-tester` automatically:
1. 📦 Analyzes your package.json to detect CLI commands
2. 🐳 Creates fresh Docker containers with specified Node versions
3. 📥 Installs your package
4. 🧪 Runs each CLI command with common flags (--help, --version, etc.)
5. ✅ Reports which commands work and which don't

## Features

- 🔍 **Auto-Discovery**: Automatically detects all CLI commands from `package.json`
- 🐳 **Docker Isolation**: Tests in clean environments
- 🔄 **Multi-Version**: Test across Node 16, 18, 20, etc.
- ⚡ **Parallel Testing**: Run tests concurrently for speed
- 📊 **Detailed Reports**: Clear pass/fail results with complete test breakdown
- 🎯 **Smart Testing**: Automatically tries --help, --version, and no-args
- 🤖 **AI-Powered Scenarios**: Generate realistic test scenarios using Claude, GPT-4, Gemini, or Groq
- 🔐 **Private Packages**: Full support for private npm packages with authentication
- 📦 **Custom Registries**: Works with private npm registries
- 💨 **Lightweight**: Minimal dependencies, fast execution

## Quick Start

```bash
# Install globally
npm install -g npm-package-tester

# Test a package from npm
npt test eslint

# Test your local package
npt test ./my-package

# Test across multiple Node versions
npt test prettier --node 16,18,20

# AI-powered intelligent testing (generates realistic scenarios)
npt test env-type-generator --ai-provider anthropic --ai-token YOUR_API_KEY

# Use OpenAI instead
npt test my-package --ai-provider openai --ai-token YOUR_OPENAI_KEY

# Test private packages
npt test @your-org/private-package --npm-token YOUR_NPM_TOKEN

# Test from custom registry
npt test @company/package --npm-registry https://npm.company.com --npm-token YOUR_TOKEN

# Keep containers for debugging
npt test --keep-containers
```

## Example Output

### Default Testing
```
📦 Package: eslint
   Version: 8.50.0

🐳 Node 20
  ✓ eslint --help (125ms)
  ✓ eslint --version (98ms)
  ✓ eslint [no args] (102ms)

📊 Summary
──────────────────────────────────────────────────
  Total: 3 tests
  Passed: 3
  Failed: 0
  Duration: 325ms

📋 Test Details
──────────────────────────────────────────────────

  🎯 Default Tests
    ✓ eslint --help (125ms)
    ✓ eslint --version (98ms)
    ✓ eslint (no args) (102ms)

✅ All tests passed!
```

### AI-Powered Testing
```
📦 Package: env-type-generator
   Version: 1.0.0
   Auto-generate TypeScript types from .env files with zero config

🐳 Node 20
  ✓ env-type-gen (1512ms)
  ✓ env-type-gen (4871ms)
  ✓ env-type-gen (1307ms)

📊 Summary
──────────────────────────────────────────────────
  Total: 3 tests
  Passed: 3
  Failed: 0
  Duration: 7690ms

📋 Test Details
──────────────────────────────────────────────────

  🤖 AI-Generated Tests
    ✓ basic-type-generation (1512ms)
    ✓ multiple-env-files-with-parsing -e .env .env.local -p (4871ms)
    ✓ strict-mode-all-required -e .env.example -o ./types/env.d.ts (1307ms)

✅ All tests passed!
```

## How It Works

### 1. **Command Detection**

```typescript
// Reads package.json
{
  "name": "my-cli-tool",
  "bin": {
    "mycli": "./dist/cli.js",      // Primary command
    "my": "./dist/cli.js"           // Alias
  }
}

// Detects: mycli, my
```

### 2. **Docker Environment**

```dockerfile
# Spins up for each Node version
FROM node:20-alpine
RUN npm install -g my-cli-tool
RUN mycli --help
RUN mycli --version
```

### 3. **Smart Testing**

For each command, automatically tests:
- `command --help` (should show help)
- `command --version` (should show version)
- `command` (no args - should not crash)
- Custom scenarios you define

## Use Cases

### 1. **Pre-Publish Validation**

```bash
# Before publishing
npm run build
npt test .
npm publish
```

### 2. **CI/CD Integration**

```yaml
# .github/workflows/test.yml
- name: Test CLI
  run: |
    npm install -g npm-package-tester
    npt test . --node 16,18,20
```

### 3. **Testing Published Packages**

```bash
# Verify your package works after publishing
npt test your-package-name@latest
```

### 4. **Debugging Installation Issues**

```bash
# Keep containers to inspect
npt test . --keep-containers
docker exec -it <container-id> sh
```

## Configuration

Create `.npmtestrc.json`:

```json
{
  "nodeVersions": ["16", "18", "20"],
  "parallel": true,
  "timeout": 30000,
  "customTests": [
    {
      "name": "Generate help",
      "command": "mycli generate --help",
      "expect": {
        "exitCode": 0,
        "stdout": "Usage:"
      }
    }
  ]
}
```

## API Usage

```typescript
import { testPackage } from 'npm-package-tester';

const results = await testPackage('eslint', {
  nodeVersions: ['20'],
  parallel: false,
});

console.log(`Passed: ${results.passed}/${results.total}`);
```

## CLI Options

```
Usage: npt test [options] <package>

Options:
  -n, --node <versions>        Node versions (comma-separated)
  -p, --parallel               Run tests in parallel
  -k, --keep-containers        Keep containers after test
  -t, --timeout <ms>           Timeout per test (default: 30000)
  --npm-token <token>          npm authentication token for private packages
  --npm-registry <url>         Custom npm registry URL
  --ai-provider <provider>     AI provider (anthropic, openai, google, groq)
  --ai-token <token>           AI API token/key
  --ai-model <model>           AI model name (optional, auto-detects best)
  --no-help                    Skip --help tests
  --no-version                 Skip --version tests
  -v, --verbose                Verbose output
```

## AI-Powered Testing

Instead of just testing `--help` and `--version`, use AI to generate realistic test scenarios:

```bash
npt test env-type-generator --ai-provider anthropic --ai-token YOUR_TOKEN
```

The AI will:
1. 📖 Analyze the package README and CLI help
2. 🧠 Understand what the package does
3. 🎯 Generate realistic test scenarios with:
   - Appropriate input files
   - Realistic command arguments
   - Expected output validation
4. ✅ Validate file creation, content, and exit codes

**Example AI-Generated Scenarios:**
```
🤖 Generating test scenarios with AI...
✨ Generated 4 AI test scenarios

🐳 Node 20
  ✓ basic-env-file-generation (1400ms)
  ✓ env-with-comments (1706ms)
  ✓ nested-env-variables (5040ms)
  ✓ strict-mode-with-custom-output (1517ms)

📊 4/4 tests passed ✅
```

### Supported AI Providers

| Provider | Model | Setup |
|----------|-------|-------|
| **Anthropic** | Claude Sonnet 4.5 | Get key from [console.anthropic.com](https://console.anthropic.com) |
| **OpenAI** | GPT-4o | Get key from [platform.openai.com](https://platform.openai.com) |
| **Google** | Gemini 2.0 Flash | Get key from [ai.google.dev](https://ai.google.dev) |
| **Groq** | Llama 3.3 70B | Get key from [console.groq.com](https://console.groq.com) |

The best model for each provider is automatically selected.

## Testing Private Packages

`npm-package-tester` fully supports private npm packages with authentication:

### Using npm Token

```bash
# Test private package from npm registry
npt test @your-org/private-package --npm-token YOUR_NPM_TOKEN

# Get your npm token from ~/.npmrc or create one with:
# npm token create --read-only
```

### Using Custom Registry

```bash
# Test from private registry (like Verdaccio, Artifactory, GitHub Packages)
npt test @company/package \
  --npm-registry https://npm.company.com \
  --npm-token YOUR_REGISTRY_TOKEN
```

### How it Works

1. The tool creates a `.npmrc` file in the Docker container
2. Configures authentication with your token
3. Installs the package securely
4. Runs all tests normally

**Security Note**: Tokens are only used within isolated Docker containers and are not stored or logged.

### Supported Registries

- ✅ npm (private packages)
- ✅ GitHub Packages
- ✅ GitLab Package Registry
- ✅ Verdaccio
- ✅ JFrog Artifactory
- ✅ Azure Artifacts
- ✅ Any npm-compatible registry

## Architecture

```
npm-package-tester
├── PackageAnalyzer      # Reads package.json, detects commands
├── CommandDetector      # Identifies CLI binaries
├── DockerManager        # Creates/manages containers
├── TestRunner           # Executes commands in containers
├── ScenarioRunner       # Runs AI-generated test scenarios
├── ScenarioGenerator    # Generates scenarios using AI
├── AIProvider           # Multi-provider AI abstraction (Claude, GPT-4, Gemini, Groq)
├── ResultFormatter      # Pretty output
└── CLI                  # User interface
```

### Clean Architecture

- **Domain**: Types, interfaces (no dependencies)
- **Application**: Business logic (PackageAnalyzer, TestRunner, ScenarioRunner)
- **AI**: AI providers and scenario generation
- **Infrastructure**: Docker, file system (external concerns)
- **CLI**: User interface (commander, chalk)

## Requirements

- Docker installed and running
- Node.js >= 16
- npm or yarn
- (Optional) AI provider API key for intelligent test generation

## Limitations

- Only tests packages with CLI commands
- Requires Docker (no Windows native support yet)
- Can't test interactive prompts automatically
- Network-dependent (pulls Docker images)
- AI features require API credits

## Roadmap

- [x] AI-powered test scenario generation
- [x] Multi-provider AI support (Anthropic, OpenAI, Google, Groq)
- [ ] Support testing interactive CLIs
- [ ] Cloud runners (no local Docker needed)
- [ ] Performance benchmarking
- [ ] Screenshot/visual testing for TUI apps
- [ ] Windows native support (WSL2)
- [ ] Custom Docker images
- [ ] CI/CD badges
- [ ] Historical test tracking

## Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute

- 🐛 **Report Bugs**: [Create a bug report](https://github.com/ashishyd/npm-package-tester/issues/new?template=bug_report.yml)
- 💡 **Suggest Features**: [Request a feature](https://github.com/ashishyd/npm-package-tester/issues/new?template=feature_request.yml)
- 📝 **Improve Documentation**: Fix typos, add examples, clarify instructions
- 🧪 **Add Tests**: Increase test coverage
- 🔧 **Fix Issues**: Check out [good first issues](https://github.com/ashishyd/npm-package-tester/labels/good%20first%20issue)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/ashishyd/npm-package-tester.git
cd npm-package-tester

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

### Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Keep PRs focused on a single feature or bug fix

### Code of Conduct

Be respectful, inclusive, and constructive. We're all here to learn and build great tools together!

## License

MIT © [Ashish Yadav](https://github.com/ashishyd)

## Related Projects

- [testcontainers](https://www.npmjs.com/package/testcontainers) - Integration testing with Docker
- [verdaccio](https://verdaccio.org/) - Private npm registry
- [np](https://github.com/sindresorhus/np) - Better npm publish

## Support

- 📖 [Documentation](https://github.com/ashishyd/npm-package-tester#readme)
- 💬 [GitHub Discussions](https://github.com/ashishyd/npm-package-tester/discussions)
- 🐛 [Issue Tracker](https://github.com/ashishyd/npm-package-tester/issues)
- 📧 [Email](mailto:ashish.yd@gmail.com)

---

**Made with ❤️ for npm package authors**

⭐ Star us on GitHub if you find this useful!
