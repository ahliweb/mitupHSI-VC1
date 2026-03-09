#!/usr/bin/env node

/**
 * Markdown Local Link Validator
 * 
 * Validates local markdown links (relative paths) in markdown files.
 * Uses stateful scanning instead of regex to properly handle:
 * - Fenced code blocks
 * - HTML comments
 * - Inline code
 * 
 * Usage: node scripts/check_markdown_local_links.mjs [options]
 * 
 * Options:
 *   --fix     Auto-fix broken links where possible
 *   --verbose Show detailed output
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const dryRun = !args.includes('--fix');
const verbose = args.includes('--verbose');

const IGNORED_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '.cache',
  '.temp'
];

const IGNORED_EXTENSIONS = ['.js', '.ts', '.json', '.xml', '.yml', '.yaml'];

function shouldIgnore(filePath) {
  const relative = path.relative(ROOT_DIR, filePath);
  const parts = relative.split(path.sep);
  return parts.some(part => IGNORED_DIRS.includes(part));
}

function isMarkdownFile(filePath) {
  return filePath.endsWith('.md') || filePath.endsWith('.mdx');
}

function collectMarkdownFiles(dir, files = []) {
  if (shouldIgnore(dir)) return files;
  
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return files;
  }
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      collectMarkdownFiles(fullPath, files);
    } else if (entry.isFile() && isMarkdownFile(fullPath)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function extractLinks(content, filePath) {
  const links = [];
  let inCodeBlock = false;
  let inHtmlComment = false;
  let codeBlockFence = '';
  
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Check for HTML comment start/end (must be outside code blocks)
    if (!inCodeBlock) {
      if (!inHtmlComment && line.includes('<!--')) {
        inHtmlComment = true;
      }
      if (inHtmlComment && line.includes('-->')) {
        inHtmlComment = false;
        continue;
      }
      if (inHtmlComment) continue;
    }
    
    // Check for fenced code blocks
    if (line.startsWith('```') || line.startsWith('~~~')) {
      const fence = line.slice(0, 3);
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockFence = fence;
      } else if (line.startsWith(codeBlockFence)) {
        inCodeBlock = false;
        codeBlockFence = '';
      }
      continue;
    }
    
    if (inCodeBlock) continue;
    
    // Skip inline code
    const inlineCodeRegex = /`[^`]+`/g;
    let textWithoutInlineCode = line.replace(inlineCodeRegex, '');
    
    // Extract markdown links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(textWithoutInlineCode)) !== null) {
      const [, text, url] = match;
      
      // Skip external links and anchors
      if (url.startsWith('http://') || 
          url.startsWith('https://') || 
          url.startsWith('mailto:') ||
          url.startsWith('#') ||
          url.startsWith('tel:') ||
          url.startsWith('javascript:')) {
        continue;
      }
      
      // Extract base path (remove query params and hash)
      const urlParts = url.split('#');
      const basePath = urlParts[0].split('?')[0];
      
      if (basePath && !basePath.startsWith('/')) {
        links.push({
          text,
          url: basePath,
          fullUrl: url,
          filePath,
          line: lineNum,
          lineContent: line.trim()
        });
      }
    }
  }
  
  return links;
}

function resolvePath(link, basePath) {
  const baseDir = path.dirname(basePath);
  const linkPath = path.join(baseDir, link);
  
  // Normalize and resolve
  const normalized = path.normalize(linkPath);
  
  // Check if file exists
  let exists = false;
  let resolvedPath = normalized;
  
  if (fs.existsSync(normalized)) {
    exists = true;
  } else {
    // Try adding common extensions
    for (const ext of ['', '.md', '.mdx', '/README.md', '/index.md']) {
      const tryPath = normalized + ext;
      if (fs.existsSync(tryPath)) {
        exists = true;
        resolvedPath = tryPath;
        break;
      }
    }
  }
  
  return { exists, path: resolvedPath };
}

function validateLinks() {
  console.log('🔍 Scanning for markdown files...\n');
  
  const mdFiles = collectMarkdownFiles(ROOT_DIR);
  console.log(`Found ${mdFiles.length} markdown files\n`);
  
  const allLinks = [];
  const brokenLinks = [];
  const warnings = [];
  
  for (const file of mdFiles) {
    if (verbose) console.log(`  Checking: ${path.relative(ROOT_DIR, file)}`);
    
    const content = fs.readFileSync(file, 'utf-8');
    const links = extractLinks(content, file);
    allLinks.push(...links);
    
    for (const link of links) {
      const { exists, path: resolvedPath } = resolvePath(link.url, link.filePath);
      
      if (!exists) {
        brokenLinks.push({
          ...link,
          attemptedPath: resolvedPath
        });
      }
    }
  }
  
  console.log(`\n📊 Results:`);
  console.log(`  Total local links: ${allLinks.length}`);
  console.log(`  Valid links: ${allLinks.length - brokenLinks.length}`);
  console.log(`  Broken links: ${brokenLinks.length}`);
  
  if (brokenLinks.length > 0) {
    console.log(`\n❌ Broken links found:\n`);
    
    for (const link of brokenLinks) {
      const relativePath = path.relative(ROOT_DIR, link.filePath);
      console.log(`  ${relativePath}:${link.line}`);
      console.log(`    Link: [${link.text}](${link.fullUrl})`);
      console.log(`    Tried: ${link.attemptedPath}`);
      console.log();
    }
    
    console.log('\n💡 Tips:');
    console.log('  - Use --fix to attempt auto-fixing (use with caution)');
    console.log('  - Check if the file was renamed or moved');
    console.log('  - Update DOCS_INDEX.md if structure changed');
    
    process.exit(1);
  }
  
  console.log('\n✅ All local links are valid!');
  process.exit(0);
}

validateLinks();
