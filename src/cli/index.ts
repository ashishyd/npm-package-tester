#!/usr/bin/env node

/**
 * CLI interface for npm-package-tester
 */

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { TestRunner } from '../application/TestRunner';
import { ResultFormatter } from '../formatters/ResultFormatter';
import { TestConfig } from '../domain/models/types';

const program = new Command();

program
  .name('npt')
  .description('Test npm packages by discovering and running CLI commands in Docker')
  .version('0.1.0');

program
  .command('test <package>')
  .description('Test an npm package or local directory')
  .option('-n, --node <versions>', 'Node versions to test (comma-separated)', '20')
  .option('-p, --parallel', 'Run tests in parallel', false)
  .option('-k, --keep-containers', 'Keep containers after test', false)
  .option('-t, --timeout <ms>', 'Timeout per test in milliseconds', '30000')
  .option('--no-help', 'Skip --help tests')
  .option('--no-version', 'Skip --version tests')
  .option('-v, --verbose', 'Verbose output')
  .action(async (packageSource: string, options: any) => {
    const spinner = ora('Starting tests...').start();
    let currentStage = '';

    try {
      const testRunner = new TestRunner();
      const formatter = new ResultFormatter();

      const config: Partial<TestConfig> = {
        package: packageSource,
        nodeVersions: options.node.split(',').map((v: string) => v.trim()),
        parallel: options.parallel,
        keepContainers: options.keepContainers,
        timeout: parseInt(options.timeout, 10),
      };

      const result = await testRunner.testPackage(packageSource, config, (event) => {
        // Update spinner with progress
        if (options.verbose) {
          if (event.stage !== currentStage) {
            if (currentStage) {
              spinner.succeed();
            }
            currentStage = event.stage;
            spinner.start(formatter.formatProgress(event));
          } else {
            spinner.text = formatter.formatProgress(event);
          }
        } else {
          spinner.text = event.message;
        }
      });

      spinner.stop();

      // Display results
      console.log(formatter.formatSummary(result));

      // Exit with appropriate code
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      spinner.fail(chalk.red('Test failed'));
      console.error(chalk.red('Error:'), (error as Error).message);

      if (options.verbose && (error as Error).stack) {
        console.error(chalk.gray((error as Error).stack));
      }

      process.exit(1);
    }
  });

program
  .command('analyze <package>')
  .description('Analyze a package to see detected CLI commands')
  .action(async (packageSource: string) => {
    const spinner = ora('Analyzing package...').start();

    try {
      const { PackageAnalyzer } = await import('../application/PackageAnalyzer');
      const analyzer = new PackageAnalyzer();

      const packageInfo = await analyzer.analyze(packageSource);

      spinner.succeed(`Analyzed ${packageInfo.name}`);

      console.log('');
      console.log(chalk.bold('📦 Package Information'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`  Name: ${chalk.cyan(packageInfo.name)}`);
      console.log(`  Version: ${chalk.cyan(packageInfo.version)}`);
      if (packageInfo.description) {
        console.log(`  Description: ${packageInfo.description}`);
      }
      console.log('');

      console.log(chalk.bold('🔧 CLI Commands'));
      console.log(chalk.gray('─'.repeat(50)));

      if (packageInfo.commands.length === 0) {
        console.log(chalk.yellow('  No CLI commands found'));
      } else {
        packageInfo.commands.forEach((cmd) => {
          const typeColor =
            cmd.type === 'primary' ? chalk.green : cmd.type === 'alias' ? chalk.blue : chalk.gray;
          console.log(`  ${chalk.cyan(cmd.name)} ${typeColor(`[${cmd.type}]`)}`);
          console.log(chalk.gray(`    Path: ${cmd.path}`));
        });
      }

      console.log('');
    } catch (error) {
      spinner.fail(chalk.red('Analysis failed'));
      console.error(chalk.red('Error:'), (error as Error).message);
      process.exit(1);
    }
  });

program.parse();
