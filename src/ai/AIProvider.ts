/**
 * AI Provider abstraction for generating test scenarios
 */

import { AIConfig, AIProvider, TestScenario } from '../domain/models/types';

export interface AIProviderClient {
  generateScenarios(
    packageName: string,
    packageDescription: string,
    readme: string,
    cliHelp: string,
    commands: string[],
  ): Promise<TestScenario[]>;
}

export class AIProviderFactory {
  static create(config: AIConfig): AIProviderClient {
    switch (config.provider) {
      case AIProvider.ANTHROPIC:
        return new AnthropicProvider(config);
      case AIProvider.OPENAI:
        return new OpenAIProvider(config);
      case AIProvider.GOOGLE:
        return new GoogleProvider(config);
      case AIProvider.GROQ:
        return new GroqProvider(config);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  static getBestModel(provider: AIProvider): string {
    switch (provider) {
      case AIProvider.ANTHROPIC:
        return 'claude-sonnet-4-5-20250929';
      case AIProvider.OPENAI:
        return 'gpt-4o';
      case AIProvider.GOOGLE:
        return 'gemini-2.0-flash-exp';
      case AIProvider.GROQ:
        return 'llama-3.3-70b-versatile';
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}

class AnthropicProvider implements AIProviderClient {
  private readonly config: AIConfig;
  private readonly model: string;

  constructor(config: AIConfig) {
    this.config = config;
    this.model = config.model || AIProviderFactory.getBestModel(AIProvider.ANTHROPIC);
  }

  async generateScenarios(
    packageName: string,
    packageDescription: string,
    readme: string,
    cliHelp: string,
    commands: string[],
  ): Promise<TestScenario[]> {
    const prompt = this.buildPrompt(packageName, packageDescription, readme, cliHelp, commands);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Anthropic API error: ${response.statusText} - ${errorBody}`);
    }

    const data = (await response.json()) as any;
    const content = data.content[0].text;

    return this.parseScenarios(content);
  }

  private buildPrompt(
    packageName: string,
    packageDescription: string,
    readme: string,
    cliHelp: string,
    commands: string[],
  ): string {
    return `You are a test scenario generator for npm CLI packages. Your task is to create realistic test scenarios that validate the package functionality.

Package Information:
- Name: ${packageName}
- Description: ${packageDescription}
- Commands: ${commands.join(', ')}

README:
${readme.substring(0, 2000)}

CLI Help Output:
${cliHelp}

Generate 2-4 realistic test scenarios that:
1. Create appropriate input files/project structure
2. Run the CLI command with realistic arguments
3. Validate the expected output files and their contents

Return ONLY a JSON array of test scenarios with this exact structure:
[
  {
    "name": "scenario name",
    "description": "what this tests",
    "setup": {
      "files": [
        {"path": "relative/path/to/file", "content": "file contents"}
      ],
      "directories": ["dir1", "dir2"],
      "dependencies": ["package-name"],
      "initNpm": true
    },
    "command": "command-name",
    "args": ["arg1", "arg2"],
    "validate": {
      "exitCode": 0,
      "stdout": ["expected text"],
      "filesExist": ["path/to/output"],
      "fileContents": [
        {
          "path": "output/file",
          "contains": ["expected content"]
        }
      ]
    }
  }
]

Return ONLY the JSON array, no additional text.`;
  }

  private parseScenarios(content: string): TestScenario[] {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;

    try {
      const scenarios = JSON.parse(jsonStr);
      return Array.isArray(scenarios) ? scenarios : [scenarios];
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${(error as Error).message}`);
    }
  }
}

class OpenAIProvider implements AIProviderClient {
  private readonly config: AIConfig;
  private readonly model: string;

  constructor(config: AIConfig) {
    this.config = config;
    this.model = config.model || AIProviderFactory.getBestModel(AIProvider.OPENAI);
  }

  async generateScenarios(
    packageName: string,
    packageDescription: string,
    readme: string,
    cliHelp: string,
    commands: string[],
  ): Promise<TestScenario[]> {
    const prompt = this.buildPrompt(packageName, packageDescription, readme, cliHelp, commands);

    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error: ${response.statusText} - ${errorBody}`);
    }

    const data = (await response.json()) as any;
    const content = data.choices[0].message.content;

    return this.parseScenarios(content);
  }

  private buildPrompt(
    packageName: string,
    packageDescription: string,
    readme: string,
    cliHelp: string,
    commands: string[],
  ): string {
    // Same prompt structure as Anthropic
    return `You are a test scenario generator for npm CLI packages. Generate realistic test scenarios in JSON format.

Package: ${packageName}
Description: ${packageDescription}
Commands: ${commands.join(', ')}
README: ${readme.substring(0, 2000)}
CLI Help: ${cliHelp}

Return a JSON object with a "scenarios" array containing 2-4 test scenarios.`;
  }

  private parseScenarios(content: string): TestScenario[] {
    const data = JSON.parse(content);
    return data.scenarios || data;
  }
}

class GoogleProvider implements AIProviderClient {
  private readonly config: AIConfig;
  private readonly model: string;

  constructor(config: AIConfig) {
    this.config = config;
    this.model = config.model || AIProviderFactory.getBestModel(AIProvider.GOOGLE);
  }

  async generateScenarios(
    packageName: string,
    packageDescription: string,
    _readme: string,
    _cliHelp: string,
    _commands: string[],
  ): Promise<TestScenario[]> {
    const prompt = `Generate test scenarios for ${packageName}: ${packageDescription}`;

    const baseUrl =
      this.config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/models';
    const response = await fetch(
      `${baseUrl}/${this.model}:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Google API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const content = data.candidates[0].content.parts[0].text;

    return this.parseScenarios(content);
  }

  private parseScenarios(content: string): TestScenario[] {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    const scenarios = JSON.parse(jsonStr);
    return Array.isArray(scenarios) ? scenarios : [scenarios];
  }
}

class GroqProvider implements AIProviderClient {
  private readonly config: AIConfig;
  private readonly model: string;

  constructor(config: AIConfig) {
    this.config = config;
    this.model = config.model || AIProviderFactory.getBestModel(AIProvider.GROQ);
  }

  async generateScenarios(
    packageName: string,
    _packageDescription: string,
    _readme: string,
    _cliHelp: string,
    _commands: string[],
  ): Promise<TestScenario[]> {
    const prompt = `Generate test scenarios for npm package ${packageName}`;

    const baseUrl = this.config.baseUrl || 'https://api.groq.com/openai/v1';
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const content = data.choices[0].message.content;

    return this.parseScenarios(content);
  }

  private parseScenarios(content: string): TestScenario[] {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    const scenarios = JSON.parse(jsonStr);
    return Array.isArray(scenarios) ? scenarios : [scenarios];
  }
}
