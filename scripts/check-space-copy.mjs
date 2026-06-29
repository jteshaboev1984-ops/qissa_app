import { readFileSync } from 'node:fs'

const files = [
  'supabase/functions/story-generate/storySpaceReference.ts',
  'supabase/functions/story-generate/storySpaceMemory.ts',
]

const forbidden = /причал/iu

for (const file of files) {
  const content = readFileSync(file, 'utf8')
  if (forbidden.test(content)) {
    throw new Error(`${file}: avoid nautical copy like “причал” in the space station story.`)
  }
}

console.log('space copy check passed: no nautical docking wording in RU space story files.')
