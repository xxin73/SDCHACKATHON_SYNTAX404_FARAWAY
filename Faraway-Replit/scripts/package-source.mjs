import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2] && path.resolve(process.argv[2]);
if (!target || fs.existsSync(target) || target.startsWith(`${root}${path.sep}`)) {
  throw new Error('Provide a new destination outside the source workspace.');
}
const directories = ['artifacts', 'lib', 'scripts', 'supabase'];
const rootFiles = [
  '.gitignore', '.npmrc', '.replit', '.replitignore', '.env.example',
  'README.md', 'replit.md', 'package.json', 'pnpm-lock.yaml',
  'pnpm-workspace.yaml', 'tsconfig.base.json', 'tsconfig.json',
];
const ignoredDirectories = new Set([
  'node_modules', 'dist', 'build', '.git', '.cache', '.local', '.agents',
  '.conversation', '.supabase', '.temp', 'coverage', 'generated-artifacts',
]);
const secrets = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:ghp_|gho_|ghu_|ghs_|ghr_|github_pat_)[A-Za-z0-9_]{20,}\b/,
  /\bAIza[0-9A-Za-z_-]{30,}\b/,
  /\bsb_secret_[A-Za-z0-9_-]{15,}\b/,
  /\beyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\b/,
  /(?:postgres(?:ql)?|mysql):\/\/[^:\s/]+:[^@\s]+@/i,
];
const files = [];
function visit(relative) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) return;
  const stat = fs.lstatSync(absolute);
  if (stat.isSymbolicLink()) throw new Error(`Symlink requires manual review: ${relative}`);
  if (stat.isDirectory()) {
    if (ignoredDirectories.has(path.basename(relative))) return;
    for (const entry of fs.readdirSync(absolute).sort()) visit(path.join(relative, entry));
    return;
  }
  const name = path.basename(relative);
  if ((name.startsWith('.env') && name !== '.env.example') ||
      name.endsWith('.tsbuildinfo') || name.endsWith('.log') ||
      name === '.DS_Store' || /^__.*review.*\.html$/.test(name)) return;
  const content = fs.readFileSync(absolute);
  // Scan text only, without logging matched values. Examples contain placeholders.
  if (name !== '.env.example' && !content.subarray(0, 8192).includes(0) &&
      secrets.some(pattern => pattern.test(content.toString('utf8')))) {
    throw new Error(`Potential embedded credential requires manual review: ${relative}`);
  }
  files.push({ relative, content, mode: stat.mode & 0o777 });
}
for (const relative of [...rootFiles, ...directories]) visit(relative);
// Validate every input before writing any package files.
fs.mkdirSync(target, { recursive: true });
const manifest = [];
for (const { relative, content, mode } of files) {
  const destination = path.join(target, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content, { mode });
  manifest.push(`${createHash('sha256').update(content).digest('hex')}  ${relative.split(path.sep).join('/')}`);
}
fs.writeFileSync(path.join(target, 'SOURCE-MANIFEST.sha256'), manifest.sort().join('\n') + '\n');
console.log(`Packaged ${files.length} files; source, assets, and configuration copied byte-for-byte.`);
