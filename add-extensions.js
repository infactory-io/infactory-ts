// Save this as add-extensions.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to add .js extensions to imports
function addJsExtensions(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Replace imports and exports
  const updatedContent = content
    // Replace relative imports/exports without file extension
    .replace(/from ['"](\.[^'"]*)['"]/g, (match, importPath) => {
      // Skip if already has an extension
      if (path.extname(importPath)) return match;
      return `from '${importPath}.js'`;
    })
    // Replace export declarations without file extension
    .replace(/export \* from ['"](\.[^'"]*)['"]/g, (match, importPath) => {
      // Skip if already has an extension
      if (path.extname(importPath)) return match;
      return `export * from '${importPath}.js'`;
    });

  if (content !== updatedContent) {
    fs.writeFileSync(filePath, updatedContent);
    console.info(`Updated: ${filePath}`);
  }
}

// Function to walk through directory
function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      addJsExtensions(filePath);
    }
  }
}

// Start processing from src directory
processDirectory(path.join(__dirname, 'src'));
console.info('Finished adding .js extensions to imports');
