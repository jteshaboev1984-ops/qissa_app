import { readFileSync, writeFileSync } from 'node:fs'

const path = 'scripts/smoke-story-generate-live.mjs'
let source = readFileSync(path, 'utf8')

const oldContinuation = `    assert(episode.state_patch?.canon_updates?.remembered_choice === chosen.choice_id, \`${'${stylePackId}'}/${'${chosen.choice_id}'}: confirmed choice is missing from canon\`)\n    assert(episode.state_patch?.canon_updates?.remembered_artifact, \`${'${stylePackId}'}/${'${chosen.choice_id}'}: remembered artifact is missing\`)`
const newContinuation = `    assert(episode.state_patch?.canon_updates?.remembered_choice === chosen.choice_id, \`${'${stylePackId}'}/${'${chosen.choice_id}'}: confirmed choice is missing from canon\`)\n    assert(episode.state_patch?.canon_updates?.beta_story_version === 'child_first_v1', \`${'${stylePackId}'}/${'${chosen.choice_id}'}: child-first story version is missing from canon\`)`

if (!source.includes(oldContinuation)) throw new Error('legacy remembered_artifact continuation assertion not found')
source = source.replace(oldContinuation, newContinuation)

const oldSpaceArtifact = `assert(spaceContinuations[0].state_patch?.canon_updates?.remembered_artifact !== spaceContinuations[1].state_patch?.canon_updates?.remembered_artifact, 'space: choices produced the same remembered artifact')\n`
if (!source.includes(oldSpaceArtifact)) throw new Error('legacy space remembered_artifact assertion not found')
source = source.replace(oldSpaceArtifact, '')

writeFileSync(path, source)
console.log('Aligned live Story smoke with child-first memory contract.')
