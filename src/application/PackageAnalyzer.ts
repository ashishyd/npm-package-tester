/**
 * Analyzes npm packages to extract CLI commands
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import execa from 'execa';
import { PackageInfo, CLICommand, CommandType, CLIExample } from '../domain/models/types';

export class PackageAnalyzer {
  /**
   * Analyze a package from npm registry or local path
   */
  async analyze(packageSource: string): Promise<PackageInfo> {
    const isLocalPath = await this.isLocalPath(packageSource);

    if (isLocalPath) {
      return await this.analyzeLocalPackage(packageSource);
    } else {
      return await this.analyzeNpmPackage(packageSource);
    }
  }

  /**
   * Analyze a local package directory
   */
  private async analyzeLocalPackage(packagePath: string): Promise<PackageInfo> {
    const packageJsonPath = path.join(packagePath, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content) as Record<string, unknown>;

    return this.extractPackageInfo(packageJson);
  }

  /**
   * Analyze a package from npm registry
   */
  private async analyzeNpmPackage(packageName: string): Promise<PackageInfo> {
    try {
      const { stdout } = await execa('npm', ['view', `${packageName}@latest`, '--json']);
      const packageJson = JSON.parse(stdout) as Record<string, unknown>;
      return this.extractPackageInfo(packageJson);
    } catch (error) {
      throw new Error(`Failed to fetch package ${packageName}: ${(error as Error).message}`);
    }
  }

  /**
   * Extract package information from package.json
   */
  private extractPackageInfo(packageJson: Record<string, unknown>): PackageInfo {
    const name = packageJson.name as string;
    const version = packageJson.version as string;
    const description = packageJson.description as string | undefined;
    const dependencies = (packageJson.dependencies as Record<string, string>) || {};
    const peerDependencies = packageJson.peerDependencies as Record<string, string> | undefined;
    const engines = packageJson.engines as Record<string, string> | undefined;

    const commands = this.extractCommands(packageJson);
    const examples = this.extractExamples(packageJson);

    return {
      name,
      version,
      description,
      commands,
      dependencies,
      peerDependencies,
      engines,
      examples,
    };
  }

  /**
   * Extract CLI commands from bin field
   */
  private extractCommands(packageJson: Record<string, unknown>): CLICommand[] {
    const bin = packageJson.bin;
    const commands: CLICommand[] = [];

    if (!bin) {
      return commands;
    }

    if (typeof bin === 'string') {
      // Single command (package name is command name)
      const name = packageJson.name as string;
      commands.push({
        name,
        path: bin,
        type: CommandType.PRIMARY,
      });
    } else if (typeof bin === 'object') {
      // Multiple commands
      const binEntries = Object.entries(bin as Record<string, string>);
      const packageName = packageJson.name as string;

      binEntries.forEach(([cmdName, cmdPath], index) => {
        const type = this.determineCommandType(cmdName, packageName, index === 0);
        commands.push({
          name: cmdName,
          path: cmdPath,
          type,
        });
      });
    }

    return commands;
  }

  /**
   * Extract examples from npt.examples field
   */
  private extractExamples(packageJson: Record<string, unknown>): CLIExample[] | undefined {
    const npt = packageJson.npt as Record<string, unknown> | undefined;

    if (!npt || !npt.examples) {
      return undefined;
    }

    const examples = npt.examples as Array<Record<string, unknown>>;

    if (!Array.isArray(examples)) {
      return undefined;
    }

    return examples
      .filter((ex) => typeof ex.command === 'string' && typeof ex.description === 'string')
      .map((ex) => ({
        command: ex.command as string,
        description: ex.description as string,
      }));
  }

  /**
   * Determine command type (primary, alias, utility)
   */
  private determineCommandType(
    commandName: string,
    packageName: string,
    isFirst: boolean,
  ): CommandType {
    // If command name matches package name, it's primary
    if (commandName === packageName) {
      return CommandType.PRIMARY;
    }

    // If it's a shortened version of package name, it's an alias
    if (packageName.includes(commandName) || commandName.includes(packageName)) {
      return isFirst ? CommandType.PRIMARY : CommandType.ALIAS;
    }

    // Check if command name is an abbreviation (e.g., "cycfix" from "cyclic-dependency-fixer")
    const packageParts = packageName.split('-');
    const initials = packageParts.map((part) => part.charAt(0)).join('');
    const isAbbreviation =
      commandName.startsWith(initials) ||
      packageParts.some((part) => commandName.startsWith(part.substring(0, 3)));
    if (isAbbreviation && !isFirst) {
      return CommandType.ALIAS;
    }

    // First command is usually primary
    if (isFirst) {
      return CommandType.PRIMARY;
    }

    return CommandType.UTILITY;
  }

  /**
   * Check if source is a local path
   */
  private async isLocalPath(source: string): Promise<boolean> {
    try {
      const stats = await fs.stat(source);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}
