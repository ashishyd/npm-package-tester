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
