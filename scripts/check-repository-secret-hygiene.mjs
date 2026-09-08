import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)

const binaryExtensions = new Set([
  '.docx', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico',
  '.zip', '.gz', '.tgz', '.mp3', '.wav', '.ogg', '.woff', '.woff2', '.ttf',
])

const tokenPatterns = [
  {
    name: 'OpenAI-style secret key',
    pattern: new RegExp(`s${'k'}-(?:proj-)?[A-Za-z0-9_-]{20,}`, 'g'),
  },
  {
    name: 'Supabase secret key',
    pattern: new RegExp(`sb_${'secret'}_[A-Za-z0-9_-]{20,}`, 'g'),
  },
  {
    name: 'GitHub classic token',
    pattern: new RegExp(`gh${'p'}_[A-Za-z0-9]{30,}`, 'g'),
  },
  {
    name: 'GitHub fine-grained token',
    pattern: new RegExp(`github_${'pat'}_[A-Za-z0-9_]{30,}`, 'g'),
  },
  {
    name: 'Private key material',
    pattern: new RegExp(['-----BEGIN ', 'PRIVATE KEY-----'].join(''), 'g'),
  },
  {
    name: 'RSA private key material',
    pattern: new RegExp(['-----BEGIN RSA ', 'PRIVATE KEY-----'].join(''), 'g'),
  },
]

const sensitiveAssignmentPattern = /^\s*(OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|PGPASSWORD|DATABASE_PASSWORD)\s*=\s*(.+?)\s*$/gm

const isPlaceholder = (value) => {
  const normalized = value.trim().replace(/^['"]|['"]$/g, '')
  return normalized === '' ||
    normalized === '...' ||
    normalized.startsWith('${') ||
    normalized.startsWith('$') ||
    normalized.startsWith('<') ||
    normalized.startsWith('[') ||
    /^(your|replace|example|test|dummy|placeholder)[-_ ]/i.test(normalized)
}

const failures = []

for (const file of trackedFiles) {
  if (binaryExtensions.has(path.extname(file).toLowerCase())) continue

  let content
  try {
    content = readFileSync(file, 'utf8')
  } catch {
    continue
  }

  if (content.includes('\u0000')) continue

  for (const { name, pattern } of tokenPatterns) {
    pattern.lastIndex = 0
    if (pattern.test(content)) failures.push(`${file}: ${name}`)
  }

  sensitiveAssignmentPattern.lastIndex = 0
  for (const match of content.matchAll(sensitiveAssignmentPattern)) {
    const value = match[2] ?? ''
    if (!isPlaceholder(value)) {
      failures.push(`${file}: literal value assigned to ${match[1]}`)
    }
  }
}

if (failures.length > 0) {
  console.error('repository secret hygiene check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  console.error('Rotate any exposed credential; deleting it from the latest commit is not sufficient if it entered Git history.')
  process.exit(1)
}

console.log(`repository secret hygiene check passed across ${trackedFiles.length} tracked files.`)
