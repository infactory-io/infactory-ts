import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

// Convert exec to promise-based function
const execPromise = promisify(exec);

// Get the examples directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const examplesDir = path.join(__dirname, '..', '..', 'examples');
const rootDir = path.join(__dirname, '..', '..');

// Helper function to run a TypeScript file using tsx
async function runExample(filePath: string): Promise<{
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: any;
}> {
  try {
    const { stdout, stderr } = await execPromise(`npx tsx ${filePath}`, {
      cwd: rootDir,
    });
    return { success: true, stdout, stderr };
  } catch (error) {
    return { success: false, error };
  }
}

describe('Examples', () => {
  // Store original environment variables to restore them after tests
  const originalEnv = { ...process.env };

  // Set up environment variables for testing
  beforeAll(() => {
    // Make sure we have the necessary environment variables for the examples
    if (!process.env.NF_API_KEY) {
      process.env.NF_API_KEY = 'test-api-key';
    }

    if (!process.env.NF_BASE_URL) {
      process.env.NF_BASE_URL = 'http://localhost:8000';
    }
  });

  // Restore original environment variables after tests
  afterAll(() => {
    process.env = originalEnv;
  });

  // Get all example files that match the *-example.ts pattern
  const exampleFiles = fs.readdirSync(examplesDir).filter((file) => {
    const filePath = path.join(examplesDir, file);
    return fs.statSync(filePath).isFile() && file.endsWith('-example.ts');
  });

  // List of examples that are known to have issues or require specific setup
  const skipExamples: string[] = [
    // Examples with module resolution issues
    'enhanced-features.ts',
    // These might be examples that require specific setup or credentials
  ];

  // Create a test for each example file
  exampleFiles.forEach((file) => {
    // Skip examples that require specific setup
    if (skipExamples.includes(file)) {
      it.skip(`should run ${file} without errors (requires specific setup)`, () => {
        // This test will be skipped
      });
      return;
    }

    // Run each example as an e2e test
    it(`should run ${file} without errors`, async () => {
      const examplePath = path.join(examplesDir, file);
      expect(fs.existsSync(examplePath)).toBe(true);

      // Run the example using tsx
      const result = await runExample(examplePath);

      // Check if the example ran successfully
      if (!result.success) {
        console.error(`Error running ${file}:
${result.error.message}`);
        if (result.error.stdout) console.log(`stdout: ${result.error.stdout}`);
        if (result.error.stderr)
          console.error(`stderr: ${result.error.stderr}`);
      }

      expect(result.success).toBe(true);
    }, 30000); // 30 second timeout for each example
  });

  // Special test for the saas_app_monitor directory if it exists
  const saasMonitorPath = path.join(examplesDir, 'saas_app_monitor');
  if (
    fs.existsSync(saasMonitorPath) &&
    fs.statSync(saasMonitorPath).isDirectory()
  ) {
    const saasFiles = fs.readdirSync(saasMonitorPath).filter((file) => {
      const filePath = path.join(saasMonitorPath, file);
      return fs.statSync(filePath).isFile() && file.endsWith('.ts');
    });

    saasFiles.forEach((file) => {
      // Skip saas_app_monitor examples as they likely require specific setup
      it.skip(`should run saas_app_monitor/${file} without errors (requires specific setup)`, () => {
        // This test will be skipped
      });
    });
  }
});
