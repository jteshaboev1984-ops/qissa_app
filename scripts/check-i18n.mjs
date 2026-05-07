import fs from 'node:fs'

const source = fs.readFileSync(new URL('../src/i18n/dictionaries.ts', import.meta.url), 'utf8')

const extractObjectLiteral = (name) => {
  const startToken = `const ${name}: I18nDictionary = `
  const start = source.indexOf(startToken)
  if (start === -1) return ''
  const braceStart = source.indexOf('{', start)
  let depth = 0
  for (let i = braceStart; i < source.length; i += 1) {
    const ch = source[i]
    if (ch === '{') depth += 1
    if (ch === '}') depth -= 1
    if (depth === 0) return source.slice(braceStart, i + 1)
  }
  return ''
}

const ruLiteral = extractObjectLiteral('ru')
const uzLiteral = extractObjectLiteral('uz')
const kzLiteral = extractObjectLiteral('kz')

const ru = Function(`return (${ruLiteral});`)()
const uz = Function('ru', `return (${uzLiteral});`)(ru)
const kz = Function('ru', `return (${kzLiteral});`)(ru)

const ruKeys = Object.keys(ru)
const compare = (name, target) => ({
  name,
  missing: ruKeys.filter((key) => !(key in target)),
  extra: Object.keys(target).filter((key) => !(key in ru)),
})

const results = [compare('uz', uz), compare('kz', kz)]
const hasErrors = results.some((r) => r.missing.length || r.extra.length)

if (hasErrors) {
  console.error('i18n completeness check failed:')
  for (const result of results) {
    if (result.missing.length) console.error(`- ${result.name} missing keys: ${result.missing.join(', ')}`)
    if (result.extra.length) console.error(`- ${result.name} extra keys: ${result.extra.join(', ')}`)
  }
  process.exit(1)
}

console.log('i18n completeness check passed for ru/uz/kz.')
