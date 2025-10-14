/**
 * Core domain types for npm-package-tester
 */

/**
 * npm package information
 */
export interface PackageInfo {
  /** Package name */
  readonly name: string;
  /** Package version */
  readonly version: string;
  /** Package description */
  readonly description?: string;
  /** CLI commands available */
  readonly commands: readonly CLICommand[];
  /** Dependencies */
  readonly dependencies: Record<string, string>;
  /** Peer dependencies */
  readonly peerDependencies?: Record<string, string>;
  /** Engines specification */
  readonly engines?: Record<string, string>;
  /** Example commands from npt.examples field */
  readonly examples?: readonly CLIExample[];
}

/**
 * Example CLI command from npt.examples field
 */
export interface CLIExample {
  /** The command to run */
  readonly command: string;
  /** Description of what it does */
  readonly description: string;
}

/**
 * CLI command extracted from package.json bin field
 */
export interface CLICommand {
  /** Command name */
  readonly name: string;
  /** Path to executable */
  readonly path: string;
  /** Detected command type */
  readonly type: CommandType;
}

/**
 * Types of CLI commands
 */
export enum CommandType {
  /** Main CLI tool */
  PRIMARY = 'primary',
  /** Alternative/alias command */
  ALIAS = 'alias',
  /** Sub-command or utility */
  UTILITY = 'utility',
}

/**
 * Test configuration
 */
export interface TestConfig {
  /** npm package name or path */
  readonly package: string;
  /** Node.js versions to test */
  readonly nodeVersions: readonly string[];
  /** Whether to test in parallel */
  readonly parallel: boolean;
  /** Timeout per test (ms) */
  readonly timeout: number;
  /** Keep containers after test */
  readonly keepContainers: boolean;
  /** Additional test scenarios */
  readonly customTests?: readonly CustomTest[];
  /** Realistic test scenarios with setup and validation */
  readonly scenarios?: readonly TestScenario[];
  /** Skip default CLI tests (--help, --version) */
  readonly skipDefaultTests?: boolean;
  /** AI configuration for automatic scenario generation */
  readonly ai?: AIConfig;
  /** npm authentication token for private packages */
  readonly npmToken?: string;
  /** Custom npm registry URL */
  readonly npmRegistry?: string;
}

/**
 * AI Provider configuration
 */
export interface AIConfig {
  /** AI provider */
  readonly provider: AIProvider;
  /** API key/token */
  readonly apiKey: string;
  /** Model name (optional - auto-detect best model) */
  readonly model?: string;
  /** Base URL for API (optional) */
  readonly baseUrl?: string;
}

/**
 * Supported AI providers
 */
export enum AIProvider {
  ANTHROPIC = 'anthropic',
  OPENAI = 'openai',
  GOOGLE = 'google',
  GROQ = 'groq',
}

/**
 * Custom test scenario
 */
export interface CustomTest {
  /** Test name */
  readonly name: string;
  /** Command to run */
  readonly command: string;
  /** Expected behavior */
  readonly expect: TestExpectation;
}

/**
 * Expected test behavior
 */
export interface TestExpectation {
  /** Expected exit code */
  readonly exitCode?: number;
  /** Expected stdout pattern */
  readonly stdout?: string | RegExp;
  /** Expected stderr pattern */
  readonly stderr?: string | RegExp;
  /** Should not timeout */
  readonly completes?: boolean;
}

/**
 * Realistic test scenario with setup and validation
 */
export interface TestScenario {
  /** Scenario name */
  readonly name: string;
  /** Description of what this tests */
  readonly description?: string;
  /** Setup phase - create files/directories */
  readonly setup?: TestSetup;
  /** Command to execute */
  readonly command: string;
  /** Command arguments */
  readonly args?: readonly string[];
  /** Validation checks */
  readonly validate: TestValidation;
}

/**
 * Test setup configuration
 */
export interface TestSetup {
  /** Files to create before test */
  readonly files?: readonly TestFile[];
  /** Directories to create */
  readonly directories?: readonly string[];
  /** npm packages to install in test project */
  readonly dependencies?: readonly string[];
  /** Initialize as npm project */
  readonly initNpm?: boolean;
}

/**
 * File to create in test environment
 */
export interface TestFile {
  /** File path relative to test directory */
  readonly path: string;
  /** File content */
  readonly content: string;
}

/**
 * Validation configuration
 */
export interface TestValidation {
  /** Expected exit code (default: 0) */
  readonly exitCode?: number;
  /** Expected stdout patterns */
  readonly stdout?: readonly (string | RegExp)[];
  /** Expected stderr patterns */
  readonly stderr?: readonly (string | RegExp)[];
  /** Files that should exist after execution */
  readonly filesExist?: readonly string[];
  /** Files that should not exist */
  readonly filesNotExist?: readonly string[];
  /** File content validations */
  readonly fileContents?: readonly FileContentValidation[];
}

/**
 * Validation for file content
 */
export interface FileContentValidation {
  /** File path to check */
  readonly path: string;
  /** Content should match these patterns */
  readonly contains?: readonly (string | RegExp)[];
  /** Content should not match these patterns */
  readonly notContains?: readonly (string | RegExp)[];
  /** Exact content match */
  readonly equals?: string;
}

/**
 * Test result for a single command
 */
export interface CommandTestResult {
  /** Command that was tested */
  readonly command: CLICommand;
  /** Node version used */
  readonly nodeVersion: string;
  /** Test passed */
  readonly passed: boolean;
  /** Duration in ms */
  readonly duration: number;
  /** Exit code */
  readonly exitCode: number;
  /** Standard output */
  readonly stdout: string;
  /** Standard error */
  readonly stderr: string;
  /** Error message if failed */
  readonly error?: string;
  /** Help output detected */
  readonly hasHelpOutput: boolean;
  /** Version output detected */
  readonly hasVersionOutput: boolean;
  /** Test scenario name (if from AI or custom scenario) */
  readonly scenarioName?: string;
  /** Test type (default, ai-generated, custom) */
  readonly testType?: 'default' | 'ai-generated' | 'custom';
  /** Command arguments used */
  readonly args?: readonly string[];
}

/**
 * Test summary for entire package
 */
export interface PackageTestSummary {
  /** Package info */
  readonly package: PackageInfo;
  /** All test results */
  readonly results: readonly CommandTestResult[];
  /** Total tests run */
  readonly total: number;
  /** Tests passed */
  readonly passed: number;
  /** Tests failed */
  readonly failed: number;
  /** Overall success */
  readonly success: boolean;
  /** Total duration */
  readonly duration: number;
}

/**
 * Test environment in Docker
 */
export interface TestEnvironment {
  /** Node.js version */
  readonly nodeVersion: string;
  /** Package manager (npm, yarn, pnpm) */
  readonly packageManager: PackageManager;
  /** Base Docker image */
  readonly baseImage: string;
  /** Additional setup commands */
  readonly setup?: readonly string[];
}

/**
 * Package managers supported
 */
export enum PackageManager {
  NPM = 'npm',
  YARN = 'yarn',
  PNPM = 'pnpm',
}

/**
 * Docker container state
 */
export interface ContainerState {
  /** Container ID */
  readonly id: string;
  /** Node version */
  readonly nodeVersion: string;
  /** Package installed */
  readonly packageName: string;
  /** Container status */
  readonly status: 'created' | 'running' | 'exited' | 'error';
}

/**
 * Progress event
 */
export interface ProgressEvent {
  /** Stage of testing */
  readonly stage: TestStage;
  /** Message */
  readonly message: string;
  /** Progress (0-100) */
  readonly progress?: number;
  /** Current command being tested */
  readonly currentCommand?: string;
}

/**
 * Test stages
 */
export enum TestStage {
  ANALYZING = 'analyzing',
  DETECTING_COMMANDS = 'detecting-commands',
  PULLING_IMAGE = 'pulling-image',
  CREATING_CONTAINER = 'creating-container',
  INSTALLING_PACKAGE = 'installing-package',
  TESTING_COMMAND = 'testing-command',
  CLEANING_UP = 'cleaning-up',
  COMPLETED = 'completed',
  ERROR = 'error',
}

/**
 * Command test strategy
 */
export interface CommandTestStrategy {
  /** Try --help flag */
  readonly testHelp: boolean;
  /** Try --version flag */
  readonly testVersion: boolean;
  /** Try running without arguments */
  readonly testNoArgs: boolean;
  /** Custom test arguments */
  readonly customArgs?: readonly string[][];
}
