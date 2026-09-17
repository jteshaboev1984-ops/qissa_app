import { randomBytes, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { applyChoiceToSeriesState, applyEpisodeToSeriesState, createInitialSeriesState } from '../src/lib/memoryAgent.ts'
import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'
import { buildArchitectPrompts } from '../supabase/functions/story-generate/story-architecture.ts'
import { collectStoryLiveEvidence, selectActualStoryChoices } from './story-live-evidence.mjs'

// DISPOSABLE audit. Three story POSTs maximum: one E1 then one E2 per real choice.
// No retry, no TTS, no Sol, no child prose, credentials or full JSON in logs/artifacts.
const branch = 'audit/v94-e1-e2-ab-single-session-20260917'
const expectedMain = '7b153a79992777479b62852613becf38b73005a4'
const deployedSha = '3dd6d84259e69f62afc8f30b8c2e9f37645ad88a'
const root = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/'
const live = process.env.QISSA_LIVE === '1'
const fail = (code) => { throw new Error(code) }
const check = (condition, code) => { if (!condition) fail(code) }
const words = (text) => String(text ?? '').trim().split(/\s+/u).filter(Boolean).length
const selections = Object.freeze({ ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' })
const consent = { version: '2026-06-25-v1', acceptedAt: new Date().toISOString(), parentOrGuardianConfirmed: true, aiProcessingAccepted: true }
const readerPreferences = { textSize: 'medium', fontMode: 'standard', lineSpacing: 'relaxed', theme: 'warm', showTextWithAudio: true, audioOnlyNightMode: true, voicePresetId: 'neutral_storyteller', defaultPlaybackMode: 'read' }
let storyPosts = 0
let stage = 'preflight'
const identities = []
const clean = { passed: true }

check(process.env.GITHUB_REF === `refs/heads/${branch}`, 'wrong_branch')
check(process.env.GITHUB_RUN_ATTEMPT === '1', 'rerun_disallowed')
check(/^[0-9a-f]{40}$/u.test(process.env.GITHUB_SHA ?? ''), 'missing_audit_sha')
check(readFileSync('audit/TEMP-v94-ab-trigger.txt','utf8').trim() === (live ? 'LIVE-V94-E1-E2-AB-ONE-20260917' : 'DRY-V94-E1-E2-AB-ONE-20260917'), 'wrong_trigger')
check(readFileSync('supabase/functions/story-generate/usage.ts','utf8').includes('readStoryAiRuntimeState'), 'runtime_guard_missing')
check(readFileSync('scripts/story-live-evidence.mjs','utf8').includes('selectActualStoryChoices'), 'actual_choice_helper_missing')

function checkEpisodeOne(episode, state) {
  check(episode?.generationSource === 'openai-structured', 'e1_body_source')
  check(episode.episode_id === 'ep-1-cozy_forest' && episode.series_id === state.id, 'e1_identity')
  check(typeof episode.story_text === 'string' && episode.story_text.includes('Malika') && !episode.story_text.includes('{{HERO}}'), 'e1_hero')
  check(words(episode.story_text) >= 320 && words(episode.story_text) <= 470, 'e1_word_range')
  check(episode.safety_self_check?.approved === true && episode.safety_self_check?.required_action === 'publish', 'e1_safety')
  check(Array.isArray(episode.vocabulary) && episode.vocabulary.length === 0, 'e1_uz_vocabulary')
  const choices = selectActualStoryChoices(episode)
  check(choices.every(c => words(c.resolution_text) >= 25 && words(c.resolution_text) <= 60), 'e1_bridges')
  check([episode.state_patch?.last_event,...choices.map(c=>c.state_patch?.last_event)].every(s=>typeof s === 'string' && s.length<=300 && /[.!?。؟]$/u.test(s.trim())), 'e1_memory_events')
  return choices
}

function branchFromE1(fullEnvelope, chosen, branchIndex) {
  const original = JSON.parse(fullEnvelope)
  const branchState = createInitialSeriesState(selections)
  check(original.episode.series_id !== branchState.id, 'branch_id_collision')
  const episode = structuredClone(original.episode)
  episode.series_id = branchState.id // literary fields, choices and top-level patch unchanged
  const afterE1 = applyEpisodeToSeriesState(branchState, episode)
  const afterChoice = applyChoiceToSeriesState(afterE1, episode, chosen)
  check(afterChoice.episodeCount === 1 && afterChoice.choiceHistory.length === 1, `branch_${branchIndex}_history`)
  check(afterChoice.choiceHistory[0].choice_id === chosen.choice_id && afterChoice.choiceHistory[0].resolution_text === chosen.resolution_text, `branch_${branchIndex}_bridge`)
  const context = normalizeStoryRequest({ selections, seriesState: afterChoice })
  check(context?.episodeIndex === 2 && context.heroName === 'Malika' && context.choiceHistory.length === 1, `branch_${branchIndex}_context`)
  check(context.choiceHistory[0].choice_id === chosen.choice_id && context.choiceHistory[0].resolution_text === chosen.resolution_text.replaceAll('Malika','{{HERO}}'), `branch_${branchIndex}_model_bridge`)
  const architectInput = JSON.parse(buildArchitectPrompts(context).user)
  check(architectInput.segment === 2 && architectInput.output_contract?.choices === 'exactly 0', `branch_${branchIndex}_segment`)
  check(architectInput.confirmed_choice_bridge?.resolution_text === context.choiceHistory[0].resolution_text, `branch_${branchIndex}_architect_bridge`)
  return { index:branchIndex, episode, chosen, afterE1, afterChoice, installationId:randomUUID(), installationAuth:randomBytes(32).toString('hex') }
}

const fakePatch = { last_event:'Malika do‘stlari bilan qo‘shiqni tugatdi.',new_friend:null,hero_trait:null,open_arc:'Do‘stlar birga kuylashni o‘rganmoqda',relationship_updates:{},canon_updates:{} }
const fakeChoice = n => ({ choice_id:`dynamic-choice-${n}`,text:`Tanlov ${n}`,effect_summary:'Malika do‘stiga yordam berdi.',resolution_text:'Malika qo‘shiqni boshladi. Do‘stlari kelib uni tingladi. Ular ohista kuyga qo‘shildilar. Barchasi birga quvondi.',tomorrow_seed:'Yangi qo‘shiq',state_patch:{...fakePatch,last_event:`Malika ${n} tanlovini yakunladi.`,canon_updates:{choice:n}} })
const mockInitial = createInitialSeriesState(selections)
const mockEpisode = { episode_id:'ep-1-cozy_forest',series_id:mockInitial.id,generationSource:'openai-structured',story_text:'Malika do‘stlari bilan qo‘shiq kuyladi. '.repeat(56),state_patch:fakePatch,vocabulary:[],safety_self_check:{approved:true,required_action:'publish'},choices:[fakeChoice(1),fakeChoice(2)] }
const mockChoices = checkEpisodeOne(mockEpisode,mockInitial)
const mockJson = JSON.stringify({episode:mockEpisode})
const mockBranches = mockChoices.map((c,i)=>branchFromE1(mockJson,c,i+1))
check(mockBranches[0].afterChoice.canonState.choice !== mockBranches[1].afterChoice.canonState.choice, 'dry_cross_branch_canon')
check(JSON.stringify(JSON.parse(mockJson).episode) === JSON.stringify(mockEpisode), 'dry_immutable_e1')
check(storyPosts === 0 && identities.length === 0, 'dry_provider_or_state_access')
if (!live) {
  console.log('V94_AB_DRY_GREEN: exact one-E1 two-dynamic-branch contexts, full in-memory envelope, no POST or persistence; main=' + expectedMain + '; deployed=' + deployedSha)
  process.exit(0)
}

const token = process.env.GITHUB_TOKEN?.trim()
const key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
check(Boolean(token && key), 'credentials_missing_no_post')
const headers = {'content-type':'application/json',apikey:key,authorization:`Bearer ${key}`,origin:'https://jteshaboev1984-ops.github.io'}

async function githubRef(name) {
  const response = await fetch(`https://api.github.com/repos/jteshaboev1984-ops/qissa_app/git/ref/heads/${name}`,{headers:{authorization:`Bearer ${token}`,accept:'application/vnd.github+json'},signal:AbortSignal.timeout(15000)})
  check(response.status===200,'github_ref_preflight')
  return (await response.json()).object.sha
}

function safeMetadata(response, label) {
  const evidence = collectStoryLiveEvidence(response.headers)
  const metadata = Object.fromEntries(Object.entries(evidence.metadata).map(([name,value])=>[name,value !== null && /^[a-z0-9_.,:;=+>\[\] -]{0,480}$/iu.test(value) ? value : null]))
  console.log('V94_AB_RESPONSE',JSON.stringify({stage:label,http:response.status,metadata,diagnosticCount:evidence.diagnosticErrors.length,storyPosts}))
  check(evidence.diagnosticErrors.length===0,`${label}_missing_diagnostics`)
  check(response.status===200,`${label}_http`)
  check(evidence.metadata['x-qissa-generation-source']==='openai-structured',`${label}_fallback`)
  check(evidence.metadata['x-qissa-escalation-used']==='false',`${label}_escalation`)
  check(evidence.metadata['x-qissa-narrator-model-used']==='gpt-5.6-luna',`${label}_model`)
  return evidence
}

async function storyPost(payload,label) {
  check(storyPosts<3,'admission_scope_exhausted')
  storyPosts += 1 // increment before network even on error; never retry
  const response = await fetch(root+'story-generate',{method:'POST',redirect:'error',headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(140000)})
  const evidence = safeMetadata(response,label) // diagnostic metadata before body assertions
  const body = await response.json()
  check(body?.episode?.generationSource===evidence.metadata['x-qissa-generation-source'],`${label}_body_header`)
  return body
}

async function statePost(identity,payload,label) {
  const response = await fetch(root+'story-state',{method:'POST',redirect:'error',headers,body:JSON.stringify({...identity,...payload}),signal:AbortSignal.timeout(30000)})
  const body = await response.json().catch(()=>null)
  check(response.status===200 && body && typeof body==='object',`${label}_state_http`)
  return body
}

function checkE2(episode, branch) {
  check(episode?.generationSource==='openai-structured','e2_body_source')
  check(episode.episode_id==='ep-2-cozy_forest' && episode.series_id===branch.afterChoice.id,'e2_identity')
  check(typeof episode.story_text==='string' && episode.story_text.includes('Malika') && !episode.story_text.includes('{{HERO}}'),'e2_hero')
  check(words(episode.story_text)>=355 && words(episode.story_text)<=520,'e2_word_range')
  check(Array.isArray(episode.choices) && episode.choices.length===0,'e2_phantom_choices')
  check(episode.safety_self_check?.approved===true && episode.safety_self_check?.required_action==='publish','e2_safety')
  check(!episode.story_text.includes(branch.chosen.resolution_text),'e2_exact_bridge_replay')
}

let failure = null
try {
  stage='github_sha_preflight'
  check(await githubRef('main')===expectedMain,'main_moved_no_post')
  check(await githubRef(branch)===process.env.GITHUB_SHA,'audit_branch_moved_no_post')
  stage='e1'
  const initial = createInitialSeriesState(selections)
  const first = await storyPost({installationId:randomUUID(),selections,seriesState:initial,privacyConsent:consent},'e1')
  const exactEnvelope = JSON.stringify(first) // immutable complete E1; in-memory ONLY; never log or upload
  const actual = checkEpisodeOne(first.episode,initial)
  stage='prepare_branches'
  const branches = actual.map((choice,i)=>branchFromE1(exactEnvelope,choice,i+1))
  check(branches[0].installationId!==branches[1].installationId && branches[0].afterE1.id!==branches[1].afterE1.id,'branch_identity_collision')
  check(JSON.stringify(first)===exactEnvelope,'e1_envelope_mutated')
  for (const item of branches) {
    stage=`persist_branch_${item.index}`
    identities.push(item) // cleanup armed BEFORE first state write
    const identity={installationId:item.installationId,installationAuth:item.installationAuth}
    const synced=await statePost(identity,{action:'sync_generated',selections,seriesState:item.afterE1,episode:item.episode,readerPreferences,privacyConsent:consent},'e1_sync')
    check(synced.ok===true,'e1_sync_failed')
    const confirmed=await statePost(identity,{action:'confirm_choice',seriesState:item.afterChoice,episodeId:item.episode.episode_id,choiceId:item.chosen.choice_id},'confirm_choice')
    check(confirmed.ok===true,'choice_confirmation_failed')
    const loaded=await statePost(identity,{action:'load_current'},'load_e1')
    check(loaded.snapshot?.episode?.story_text===item.episode.story_text,'e1_persisted_prose_mismatch')
    check(JSON.stringify(loaded.snapshot.episode.choices)===JSON.stringify(item.episode.choices),'e1_persisted_choices_mismatch')
    check(loaded.snapshot.seriesState.choiceHistory?.length===1 && loaded.snapshot.seriesState.choiceHistory[0].choice_id===item.chosen.choice_id,'saved_choice_mismatch')
    check(loaded.snapshot.seriesState.choiceHistory[0].resolution_text===item.chosen.resolution_text,'saved_bridge_mismatch')
    item.afterChoice=loaded.snapshot.seriesState
    console.log('V94_AB_BRANCH_PREPARED',JSON.stringify({branch:item.index,choiceSelected:true,savedBridge:true,episodeCount:1}))
  }
  stage='e2_both_once'
  check(storyPosts===1,'unexpected_e1_posts')
  const continuations=await Promise.allSettled(branches.map(item=>storyPost({installationId:item.installationId,selections,seriesState:item.afterChoice,privacyConsent:consent},`e2_${item.index}`)))
  check(storyPosts===3,'unexpected_e2_post_count')
  let successfulE2=[]
  for (let i=0;i<continuations.length;i++) {
    const result=continuations[i]
    if(result.status==='rejected') {
      console.log('V94_AB_E2_NO_GO',JSON.stringify({branch:i+1,code:typeof result.reason?.message==='string' && /^[a-z0-9_]+$/u.test(result.reason.message)?result.reason.message:'unexpected'}))
      continue
    }
    const episode=result.value.episode
    checkE2(episode,branches[i])
    successfulE2.push({branch:branches[i],episode})
  }
  check(successfulE2.length===2,'e2_pair_incomplete')
  check(successfulE2[0].episode.story_text!==successfulE2[1].episode.story_text,'e2_branches_identical')
  for (const {branch:item,episode} of successfulE2) {
    stage=`e2_persist_${item.index}`
    const identity={installationId:item.installationId,installationAuth:item.installationAuth}
    const afterE2=applyEpisodeToSeriesState(item.afterChoice,episode)
    const synced=await statePost(identity,{action:'sync_generated',selections,seriesState:afterE2,episode,readerPreferences,privacyConsent:consent},'e2_sync')
    check(synced.ok===true,'e2_sync_failed')
    const loaded=await statePost(identity,{action:'load_current'},'load_e2')
    check(loaded.snapshot?.episode?.episode_id===episode.episode_id && loaded.snapshot.seriesState.episodeCount===2,'e2_reload_failed')
    check(loaded.snapshot.seriesState.choiceHistory.length===1 && loaded.snapshot.seriesState.choiceHistory[0].choice_id===item.chosen.choice_id,'e2_cross_branch_history')
    console.log('V94_AB_E2_TECH',JSON.stringify({branch:item.index,words:words(episode.story_text),persisted:true,choiceHistory:1,hasNewChoices:false}))
  }
  check(JSON.stringify(first)===exactEnvelope,'e1_envelope_changed_after_e2')
  stage='technical_complete'
  console.log('V94_AB_TECH_PASS',JSON.stringify({storyPosts,oneImmutableE1:true,independentE2:2,sol:false,tts:false,editorialNativeReview:false}))
} catch (error) {
  failure=typeof error?.message==='string' && /^[a-z0-9_]+$/u.test(error.message)?error.message:'unexpected'
  console.error('V94_AB_STOP',JSON.stringify({stage,code:failure,storyPosts,noRetries:true}))
} finally {
  // Always clean both generated profile credentials even if persistence partially failed.
  for (const item of identities) {
    const identity={installationId:item.installationId,installationAuth:item.installationAuth}
    try {
      const deleted=await statePost(identity,{action:'delete_profile_data'},'cleanup_delete')
      check(deleted.ok===true && deleted.deletedAudioObjectCount===0,'cleanup_delete_not_confirmed')
      const loaded=await statePost(identity,{action:'load_current'},'cleanup_load')
      check(loaded.snapshot===null,'cleanup_residual_profile')
      console.log('V94_AB_CLEANUP',JSON.stringify({branch:item.index,installationId:item.installationId,deleted:deleted.deleted===true,absent:true}))
    } catch {
      clean.passed=false
      console.error('V94_AB_CLEANUP_FAIL',JSON.stringify({branch:item.index,installationId:item.installationId}))
    }
  }
  console.log('V94_AB_FINAL',JSON.stringify({storyPosts,cleanup:clean.passed?'PASS':'FAIL',result:failure?'NO_GO':'TECH_PASS',nativeUzReview:'NOT_DONE'}))
  if (failure || !clean.passed) process.exitCode=1
}
