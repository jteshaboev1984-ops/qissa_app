#!/usr/bin/env node
/**
 * QISSA owner-approved ONE-ADVISORY release exception, 2026-11-18.
 * This is NOT a picomatch fix. See Issue #336 and the Stage1 release record.
 * npm run audit:all remains unchanged and can report the unresolved advisory.
 * Any new advisory, package-lock edit, missing security data or different
 * transitive chain must fail closed.
 */
import { execFileSync, spawnSync } from 'node:child_process'

const advisory = 'GHSA-fc5q-39xc-vjpf'
const allowedPackages = new Set([
  'picomatch', 'fdir', 'tinyglobby', 'vite', '@vitejs/plugin-react',
])
const approvedLockBlob = '2f7b70f714bc5083b0a88ae3c815b88f42d4625d'
const vulnerabilityLevels = ['info', 'low', 'moderate', 'high', 'critical']

const fail = (reason) => {
  console.error('[QISSA release audit] BLOCKED: ' + reason)
  process.exit(1)
}
let lockBlob
try {
  lockBlob = execFileSync('git', ['hash-object', 'package-lock.json'], { encoding: 'utf8' }).trim()
} catch (error) {
  fail('cannot independently hash package-lock.json: ' + error.message)
}
const result = spawnSync('npm', ['audit', '--json', '--audit-level=high'], {
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024,
})
if (result.error || result.signal || ![0, 1].includes(result.status)) {
  fail('npm audit failed unexpectedly: ' + (result.error?.message ?? result.stderr ?? result.status))
}
let audit
try {
  audit = JSON.parse(result.stdout)
} catch {
  fail('npm audit did not return machine-readable JSON; no exception granted')
}
if (audit.error || !audit.vulnerabilities || !audit.metadata?.vulnerabilities) {
  fail('invalid or incomplete npm audit data')
}
const reported = audit.metadata.vulnerabilities
if (!vulnerabilityLevels.every(k => Number.isInteger(reported[k]) && reported[k] >= 0)) {
  fail('missing vulnerability counts')
}
const problems = Object.entries(audit.vulnerabilities)
if (problems.length === 0 && vulnerabilityLevels.every(k => reported[k] === 0) && result.status === 0) {
  console.log('[QISSA release audit] PASS: no vulnerabilities')
  process.exit(0)
}
if (lockBlob !== approvedLockBlob) {
  fail('package-lock.json changed; owner exception was scoped to blob ' + approvedLockBlob)
}
if (
  problems.length !== 5 || reported.high !== 5 ||
  vulnerabilityLevels.some(k => k !== 'high' && reported[k] !== 0) ||
  result.status !== 1
) {
  fail('vulnerability counts differ from explicitly accepted five high transitive findings')
}
const byName = audit.vulnerabilities
if (problems.some(([name, entry]) =>
  !allowedPackages.has(name) || entry.severity !== 'high' ||
  !Array.isArray(entry.via) || !entry.via.length
)) {
  fail('unexpected vulnerable package, severity or advisory structure')
}
if (![...allowedPackages].every(name => Object.hasOwn(byName, name))) {
  fail('vulnerable package set changed')
}
const root = byName.picomatch
if (
  root.via.length !== 1 || typeof root.via[0] !== 'object' ||
  root.via[0].name !== 'picomatch' ||
  root.via[0].severity !== 'high' ||
  !String(root.via[0].url ?? '').endsWith('/' + advisory)
) {
  fail('picomatch root advisory is not exactly the owner-accepted GHSA')
}
for (const name of allowedPackages) {
  if (name === 'picomatch') continue
  if (byName[name].via.some(dep => typeof dep !== 'string' || !allowedPackages.has(dep))) {
    fail(name + ' has an independent advisory outside the accepted transitive chain')
  }
}
const reachesRoot = (name, visited = new Set()) => {
  if (name === 'picomatch') return true
  if (visited.has(name)) return false
  visited.add(name)
  return byName[name].via.some(dep => reachesRoot(dep, new Set(visited)))
}
if (![...allowedPackages].every(name => reachesRoot(name))) {
  fail('some vulnerable package is not proven transitive to the accepted picomatch GHSA')
}
console.warn('[QISSA release audit] EXCEPTION: 5 high transitive findings, exclusively ' + advisory)
console.warn('[QISSA release audit] NOT FIXED. Owner-authorized Stage1 release 2026-11-18; Issue #336 stays OPEN.')
console.warn('[QISSA release audit] lockfile, package set, exact advisory and absence of all other findings verified.')
