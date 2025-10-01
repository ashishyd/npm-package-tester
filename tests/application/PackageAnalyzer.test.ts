/**
 * Unit tests for PackageAnalyzer
 */

import { PackageAnalyzer } from '../../src/application/PackageAnalyzer';
import { CommandType } from '../../src/domain/models/types';

describe('PackageAnalyzer', () => {
  let analyzer: PackageAnalyzer;

  beforeEach(() => {
    analyzer = new PackageAnalyzer();
  });

  describe('extractCommands', () => {
    it('should extract single command from string bin', () => {
      const packageJson = {
        name: 'my-cli',
        version: '1.0.0',
        bin: './cli.js',
        dependencies: {},
      };

      const result = (analyzer as any).extractCommands(packageJson);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('my-cli');
      expect(result[0].path).toBe('./cli.js');
      expect(result[0].type).toBe(CommandType.PRIMARY);
    });

    it('should extract multiple commands from object bin', () => {
      const packageJson = {
        name: 'my-cli',
        version: '1.0.0',
        bin: {
          'my-cli': './cli.js',
          mycli: './cli.js',
        },
        dependencies: {},
      };

      const result = (analyzer as any).extractCommands(packageJson);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('my-cli');
      expect(result[1].name).toBe('mycli');
    });

    it('should return empty array if no bin field', () => {
      const packageJson = {
        name: 'my-package',
        version: '1.0.0',
        dependencies: {},
      };

      const result = (analyzer as any).extractCommands(packageJson);

      expect(result).toHaveLength(0);
    });
  });

  describe('determineCommandType', () => {
    it('should identify primary command matching package name', () => {
      const result = (analyzer as any).determineCommandType('eslint', 'eslint', false);
      expect(result).toBe(CommandType.PRIMARY);
    });

    it('should identify alias command', () => {
      const result = (analyzer as any).determineCommandType('cycfix', 'cyclic-dependency-fixer', false);
      expect(result).toBe(CommandType.ALIAS);
    });

    it('should identify first command as primary', () => {
      const result = (analyzer as any).determineCommandType('cmd', 'package', true);
      expect(result).toBe(CommandType.PRIMARY);
    });

    it('should identify utility command', () => {
      const result = (analyzer as any).determineCommandType('util', 'package', false);
      expect(result).toBe(CommandType.UTILITY);
    });
  });

  describe('extractPackageInfo', () => {
    it('should extract all package information', () => {
      const packageJson = {
        name: 'test-package',
        version: '1.2.3',
        description: 'A test package',
        bin: {
          test: './bin/test.js',
        },
        dependencies: {
          chalk: '^4.0.0',
        },
        peerDependencies: {
          typescript: '^5.0.0',
        },
        engines: {
          node: '>=16',
        },
      };

      const result = (analyzer as any).extractPackageInfo(packageJson);

      expect(result.name).toBe('test-package');
      expect(result.version).toBe('1.2.3');
      expect(result.description).toBe('A test package');
      expect(result.commands).toHaveLength(1);
      expect(result.dependencies).toHaveProperty('chalk');
      expect(result.peerDependencies).toHaveProperty('typescript');
      expect(result.engines).toHaveProperty('node');
    });
  });
});
