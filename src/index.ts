/**
 * Public API for npm-package-tester
 */

// Export domain types
export {
  PackageInfo,
  CLICommand,
  CommandType,
  TestConfig,
  CommandTestResult,
  PackageTestSummary,
  TestEnvironment,
  PackageManager,
  ProgressEvent,
  TestStage,
} from './domain/models/types';

// Export main components
export { PackageAnalyzer } from './application/PackageAnalyzer';
export { TestRunner } from './application/TestRunner';
export { DockerManager } from './application/DockerManager';
export { ResultFormatter } from './formatters/ResultFormatter';

// Convenience function
import { TestRunner } from './application/TestRunner';
import { TestConfig, PackageTestSummary } from './domain/models/types';

/**
 * Test a package with simplified API
 */
export async function testPackage(
  packageSource: string,
  config?: Partial<TestConfig>,
): Promise<PackageTestSummary> {
  const runner = new TestRunner();
  return await runner.testPackage(packageSource, config || {});
}

/**
 * Analyze a package to detect CLI commands
 */
export async function analyzePackage(packageSource: string): Promise<any> {
  const { PackageAnalyzer } = await import('./application/PackageAnalyzer');
  const analyzer = new PackageAnalyzer();
  return await analyzer.analyze(packageSource);
}
