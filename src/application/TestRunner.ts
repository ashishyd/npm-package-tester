/**
 * Runs CLI command tests in Docker containers
 */

import {
  PackageInfo,
  CommandTestResult,
  PackageTestSummary,
  TestConfig,
  ProgressEvent,
  TestStage,
  TestEnvironment,
  PackageManager,
  CLICommand,
} from '../domain/models/types';
import { DockerManager } from './DockerManager';
import { PackageAnalyzer } from './PackageAnalyzer';
import { ScenarioRunner } from './ScenarioRunner';
import { ScenarioGenerator } from '../ai/ScenarioGenerator';

export class TestRunner {
  private readonly dockerManager: DockerManager;
  private readonly packageAnalyzer: PackageAnalyzer;
  private readonly scenarioRunner: ScenarioRunner;
  private readonly scenarioGenerator: ScenarioGenerator;

  constructor() {
    this.dockerManager = new DockerManager();
    this.packageAnalyzer = new PackageAnalyzer();
    this.scenarioRunner = new ScenarioRunner(this.dockerManager);
    this.scenarioGenerator = new ScenarioGenerator(this.dockerManager);
  }

  /**
   * Test a package with given configuration
   */
  async testPackage(
    packageSource: string,
    config: Partial<TestConfig>,
    onProgress?: (event: ProgressEvent) => void,
  ): Promise<PackageTestSummary> {
    const startTime = Date.now();

    try {
      // Analyze package
      this.emitProgress(onProgress, {
        stage: TestStage.ANALYZING,
        message: `Analyzing package: ${packageSource}`,
      });

      const packageInfo = await this.packageAnalyzer.analyze(packageSource);

      this.emitProgress(onProgress, {
        stage: TestStage.DETECTING_COMMANDS,
        message: `Found ${packageInfo.commands.length} CLI command(s)`,
      });

      // Check Docker
      const dockerAvailable = await this.dockerManager.isDockerAvailable();
      if (!dockerAvailable) {
        throw new Error('Docker is not available. Please ensure Docker is installed and running.');
      }

      // Prepare test config
      const testConfig = this.prepareConfig(config);

      // Run tests
      const results = await this.runTests(packageInfo, testConfig, onProgress);

      const duration = Date.now() - startTime;

      // Create summary
      const summary: PackageTestSummary = {
        package: packageInfo,
        results,
        total: results.length,
        passed: results.filter((r) => r.passed).length,
        failed: results.filter((r) => !r.passed).length,
        success: results.every((r) => r.passed),
        duration,
      };

      this.emitProgress(onProgress, {
        stage: TestStage.COMPLETED,
        message: `Testing completed: ${summary.passed}/${summary.total} passed`,
      });

      return summary;
    } finally {
      // Cleanup
      this.emitProgress(onProgress, {
        stage: TestStage.CLEANING_UP,
        message: 'Cleaning up containers',
      });

      await this.dockerManager.cleanup(config.keepContainers || false);
    }
  }

  /**
   * Run all tests
   */
  private async runTests(
    packageInfo: PackageInfo,
    config: TestConfig,
    onProgress?: (event: ProgressEvent) => void,
  ): Promise<CommandTestResult[]> {
    const results: CommandTestResult[] = [];

    for (const nodeVersion of config.nodeVersions) {
      const environment: TestEnvironment = {
        nodeVersion,
        packageManager: PackageManager.NPM,
        baseImage: `node:${nodeVersion}-alpine`,
      };

      // Create container
      const container = await this.dockerManager.createTestContainer(
        environment,
        packageInfo.name,
        onProgress,
      );

      // Install package
      await this.dockerManager.installPackage(container.id, packageInfo.name, onProgress);

      // Generate AI scenarios if configured
      if (config.ai) {
        this.emitProgress(onProgress, {
          stage: TestStage.TESTING_COMMAND,
          message: '🤖 Generating test scenarios with AI...',
        });

        try {
          const aiScenarios = await this.scenarioGenerator.generateScenarios(
            packageInfo,
            config.ai,
            container.id,
          );

          this.emitProgress(onProgress, {
            stage: TestStage.TESTING_COMMAND,
            message: `✨ Generated ${aiScenarios.length} AI test scenarios`,
          });

          // Run AI-generated scenarios
          for (const scenario of aiScenarios) {
            const command = packageInfo.commands[0]; // Use first command
            const result = await this.scenarioRunner.runScenario(
              container.id,
              packageInfo.name,
              command.name,
              scenario,
              nodeVersion,
              command,
              onProgress,
            );
            results.push(result);
          }
        } catch (error) {
          this.emitProgress(onProgress, {
            stage: TestStage.ERROR,
            message: `AI scenario generation failed: ${(error as Error).message}`,
          });
          console.error('AI Error:', error);
        }
      }

      // Run default tests if not skipped
      if (!config.skipDefaultTests) {
        // Test each command
        for (const command of packageInfo.commands) {
          this.emitProgress(onProgress, {
            stage: TestStage.TESTING_COMMAND,
            message: `Testing ${command.name} in Node ${nodeVersion}`,
            currentCommand: command.name,
          });

          // Test --help
          const helpResult = await this.testCommand(
            container.id,
            command.name,
            ['--help'],
            nodeVersion,
            command,
          );
          results.push(helpResult);

          // Test --version
          const versionResult = await this.testCommand(
            container.id,
            command.name,
            ['--version'],
            nodeVersion,
            command,
          );
          results.push(versionResult);

          // Test no args
          const noArgsResult = await this.testCommand(
            container.id,
            command.name,
            [],
            nodeVersion,
            command,
          );
          results.push(noArgsResult);
        }
      }
    }

    return results;
  }

  /**
   * Test a single command
   */
  private async testCommand(
    containerId: string,
    commandName: string,
    args: string[],
    nodeVersion: string,
    command: CLICommand,
  ): Promise<CommandTestResult> {
    const startTime = Date.now();

    try {
      const fullCommand = [commandName, ...args];
      const result = await this.dockerManager.executeCommand(containerId, fullCommand);

      const duration = Date.now() - startTime;

      // Determine if test passed
      const passed = this.isTestPassed(result, args);

      return {
        command,
        nodeVersion,
        passed,
        duration,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        hasHelpOutput: this.hasHelpOutput(result.stdout, result.stderr),
        hasVersionOutput: this.hasVersionOutput(result.stdout, result.stderr),
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        command,
        nodeVersion,
        passed: false,
        duration,
        exitCode: 1,
        stdout: '',
        stderr: (error as Error).message,
        error: (error as Error).message,
        hasHelpOutput: false,
        hasVersionOutput: false,
      };
    }
  }

  /**
   * Determine if test passed
   */
  private isTestPassed(
    result: { exitCode: number; stdout: string; stderr: string },
    args: string[],
  ): boolean {
    // For --help and --version, exit code 0 is expected
    if (args.includes('--help') || args.includes('--version')) {
      return result.exitCode === 0;
    }

    // For no args, we just check it doesn't crash completely
    // Some CLIs exit with 1 when no args provided (which is acceptable)
    return result.exitCode === 0 || result.exitCode === 1;
  }

  /**
   * Check if output contains help information
   */
  private hasHelpOutput(stdout: string, stderr: string): boolean {
    const output = (stdout + stderr).toLowerCase();
    return (
      output.includes('usage') ||
      output.includes('options') ||
      output.includes('commands') ||
      output.includes('help')
    );
  }

  /**
   * Check if output contains version information
   */
  private hasVersionOutput(stdout: string, stderr: string): boolean {
    const output = (stdout + stderr).toLowerCase();
    // Match version patterns like "1.0.0" or "v1.0.0"
    return /v?\d+\.\d+\.\d+/.test(output);
  }

  /**
   * Prepare test configuration with defaults
   */
  private prepareConfig(partial: Partial<TestConfig>): TestConfig {
    return {
      package: partial.package || '',
      nodeVersions: partial.nodeVersions || ['20'],
      parallel: partial.parallel !== undefined ? partial.parallel : false,
      timeout: partial.timeout || 30000,
      keepContainers: partial.keepContainers !== undefined ? partial.keepContainers : false,
      customTests: partial.customTests || [],
      scenarios: partial.scenarios,
      skipDefaultTests: partial.skipDefaultTests || false,
      ai: partial.ai,
    };
  }

  /**
   * Emit progress event
   */
  private emitProgress(
    callback: ((event: ProgressEvent) => void) | undefined,
    event: ProgressEvent,
  ): void {
    if (callback) {
      callback(event);
    }
  }
}
