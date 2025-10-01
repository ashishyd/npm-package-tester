# npm-package-tester

🧪 **Automatically test npm packages by discovering their CLI commands and running them in isolated Docker environments**

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
- 📊 **Detailed Reports**: Clear pass/fail results with logs
- 🎯 **Smart Testing**: Automatically tries --help, --version, and no-args
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

# Keep containers for debugging
npt test --keep-containers
```

## Example Output

```
📦 Analyzing package: eslint
✓ Found 1 CLI command: eslint

🐳 Testing in Node 20...
  ✓ eslint --help (125ms)
  ✓ eslint --version (98ms)
  ✓ eslint [no args] (102ms)

🐳 Testing in Node 18...
  ✓ eslint --help (118ms)
  ✓ eslint --version (95ms)
  ✓ eslint [no args] (105ms)

📊 Summary
  Total: 6 tests
  Passed: 6
  Failed: 0
  Duration: 643ms

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
  -n, --node <versions>     Node versions (comma-separated)
  -p, --parallel            Run tests in parallel
  -k, --keep-containers     Keep containers after test
  -t, --timeout <ms>        Timeout per test (default: 30000)
  --no-help                 Skip --help tests
  --no-version              Skip --version tests
  -v, --verbose             Verbose output
```

## Real-World Example

Testing our `cyclic-dependency-fixer` package:

```bash
npt test cyclic-dependency-fixer
```

**Output:**
```
📦 Analyzing: cyclic-dependency-fixer
✓ Found 2 commands: cycfix, cyclic-dependency-fixer

🐳 Node 20
  ✓ cycfix --help          Shows usage information
  ✓ cycfix --version       Shows v0.1.0
  ✓ cycfix detect --help   Shows detect command help
  ✓ cycfix fix --help      Shows fix command help

📊 4/4 tests passed ✅
```

## Architecture

```
npm-package-tester
├── PackageAnalyzer      # Reads package.json, detects commands
├── CommandDetector      # Identifies CLI binaries
├── DockerManager        # Creates/manages containers
├── TestRunner           # Executes commands in containers
├── ResultFormatter      # Pretty output
└── CLI                  # User interface
```

### Clean Architecture

- **Domain**: Types, interfaces (no dependencies)
- **Application**: Business logic (PackageAnalyzer, TestRunner)
- **Infrastructure**: Docker, file system (external concerns)
- **CLI**: User interface (commander, chalk)

## Requirements

- Docker installed and running
- Node.js >= 16
- npm or yarn

## Limitations

- Only tests packages with CLI commands
- Requires Docker (no Windows native support yet)
- Can't test interactive prompts automatically
- Network-dependent (pulls Docker images)

## Roadmap

- [ ] Support testing interactive CLIs
- [ ] Cloud runners (no local Docker needed)
- [ ] Performance benchmarking
- [ ] Screenshot/visual testing for TUI apps
- [ ] Windows native support (WSL2)
- [ ] Custom Docker images
- [ ] CI/CD badges
- [ ] Historical test tracking

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT

## Related Projects

- [testcontainers](https://www.npmjs.com/package/testcontainers) - Integration testing with Docker
- [verdaccio](https://verdaccio.org/) - Private npm registry
- [np](https://github.com/sindresorhus/np) - Better npm publish

---

**Made with ❤️ for npm package authors**
