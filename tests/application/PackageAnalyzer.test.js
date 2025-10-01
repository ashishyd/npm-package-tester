"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PackageAnalyzer_1 = require("../../src/application/PackageAnalyzer");
const types_1 = require("../../src/domain/models/types");
describe('PackageAnalyzer', () => {
    let analyzer;
    beforeEach(() => {
        analyzer = new PackageAnalyzer_1.PackageAnalyzer();
    });
    describe('extractCommands', () => {
        it('should extract single command from string bin', () => {
            const packageJson = {
                name: 'my-cli',
                version: '1.0.0',
                bin: './cli.js',
                dependencies: {},
            };
            const result = analyzer.extractCommands(packageJson);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('my-cli');
            expect(result[0].path).toBe('./cli.js');
            expect(result[0].type).toBe(types_1.CommandType.PRIMARY);
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
            const result = analyzer.extractCommands(packageJson);
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
            const result = analyzer.extractCommands(packageJson);
            expect(result).toHaveLength(0);
        });
    });
    describe('determineCommandType', () => {
        it('should identify primary command matching package name', () => {
            const result = analyzer.determineCommandType('eslint', 'eslint', false);
            expect(result).toBe(types_1.CommandType.PRIMARY);
        });
        it('should identify alias command', () => {
            const result = analyzer.determineCommandType('cycfix', 'cyclic-dependency-fixer', false);
            expect(result).toBe(types_1.CommandType.ALIAS);
        });
        it('should identify first command as primary', () => {
            const result = analyzer.determineCommandType('cmd', 'package', true);
            expect(result).toBe(types_1.CommandType.PRIMARY);
        });
        it('should identify utility command', () => {
            const result = analyzer.determineCommandType('util', 'package', false);
            expect(result).toBe(types_1.CommandType.UTILITY);
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
            const result = analyzer.extractPackageInfo(packageJson);
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
//# sourceMappingURL=PackageAnalyzer.test.js.map