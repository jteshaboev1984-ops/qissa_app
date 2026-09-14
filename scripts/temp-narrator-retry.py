from pathlib import Path

index_path = Path('supabase/functions/story-generate/split-index.ts')
arch_path = Path('supabase/functions/story-generate/story-architecture.ts')
check_path = Path('scripts/check-story-ai-split.mjs')

index = index_path.read_text()
index = index.replace(
"  let repairUsed = false\n  let escalationUsed = false\n",
"  let repairUsed = false\n  let narratorRetryUsed = false\n  let escalationUsed = false\n"
)
index = index.replace(
"      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),\n      'X-QISSA-Provider-Calls': String(providerCalls),\n    })\n  }\n\n  let validationErrors = validateCandidate(context, candidate)\n",
"      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),\n      'X-QISSA-Provider-Calls': String(providerCalls),\n      'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),\n    })\n  }\n\n  let validationErrors = validateCandidate(context, candidate)\n"
)
start = index.index("  let validationErrors = validateCandidate(context, candidate)\n")
end = index.index("  if (validationErrors.length > 0 || !candidate) {\n", start)
if start < 0 or end < 0:
    raise SystemExit('validation block markers missing')
new_block = '''  let validationErrors = validateCandidate(context, candidate)
  if (validationErrors.length > 0) {
    trace.push(`narrator-validation:${validationErrors.join(',')}[${candidateValidationMetrics(candidate).join(',')}]`)
  }

  // One prose-only Luna retry is safe because the immutable Architect blueprint owns all canon,
  // branch consequences and choices. This retry cannot mutate state; it only rewrites narration.
  if (validationErrors.length > 0 && !isTextLengthOnlyFailure(validationErrors)) {
    try {
      providerCalls += 1
      narratorRetryUsed = true
      const retryFeedback = [
        `Previous narration failed deterministic validation: ${validationErrors.join(', ')}.`,
        `Observed metrics: ${candidateValidationMetrics(candidate).join(', ')}.`,
        'Keep the immutable blueprint exactly unchanged.',
        'Correct every listed narration failure in one pass. If story_too_short is present, add meaningful action/dialogue/reaction inside existing blueprint beats until the hard minimum is safely exceeded.',
        'For russian_hero_requires_rewrite, keep {{HERO}} only as nominative subject or direct address and rewrite every case/preposition or gendered-past-tense construction around the token.',
      ].join(' ')
      const narration = await generateStoryNarration(openAiApiKey, narratorModel, context, blueprint, retryFeedback)
      candidate = narrationToCandidate(context, blueprint, narration)
      validationErrors = validateCandidate(context, candidate)
      if (validationErrors.length > 0) {
        trace.push(`narrator-retry-validation:${validationErrors.join(',')}[${candidateValidationMetrics(candidate).join(',')}]`)
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 240) : 'provider_error'
      lastFailureClass = providerFailureClass(reason)
      trace.push(`narrator-retry:${lastFailureClass}`)
      return safeFallback(context, origin, 'generation-or-safety-failed', {
        ...providerMetadata(),
        ...claimMetadata(claim),
        'X-QISSA-Generation-Failure-Class': lastFailureClass,
        'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
        'X-QISSA-Narrator-Retry-Used': 'true',
        'X-QISSA-Provider-Calls': String(providerCalls),
        'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),
      })
    }
  }

  if (validationErrors.length > 0 && isTextLengthOnlyFailure(validationErrors)) {
    try {
      providerCalls += 1
      candidate = await repairStoryCandidateTextLengths(
        openAiApiKey,
        narratorModel,
        context,
        candidate,
        validationErrors,
      )
      repairUsed = true
      validationErrors = validateCandidate(context, candidate)
      if (validationErrors.length > 0) {
        lastFailureClass = 'validation'
        trace.push(`repair-validation:${validationErrors.join(',')}[${candidateValidationMetrics(candidate).join(',')}]`)
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 240) : 'provider_error'
      lastFailureClass = providerFailureClass(reason)
      trace.push(`repair:${lastFailureClass}`)
      return safeFallback(context, origin, 'generation-or-safety-failed', {
        ...providerMetadata(),
        ...claimMetadata(claim),
        'X-QISSA-Generation-Failure-Class': lastFailureClass,
        'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
        'X-QISSA-Generation-Repair': 'text-length',
        'X-QISSA-Narrator-Retry-Used': narratorRetryUsed ? 'true' : 'false',
        'X-QISSA-Provider-Calls': String(providerCalls),
        'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),
      })
    }
  }

  if (validationErrors.length > 0 && escalationModel && escalationModel !== narratorModel) {
    try {
      providerCalls += 1
      narratorModelUsed = escalationModel
      const retryFeedback = `Luna narration still failed deterministic validation after bounded correction: ${validationErrors.join(', ')}. Keep the immutable blueprint exactly unchanged and correct only the narration.`
      const narration = await generateStoryNarration(openAiApiKey, escalationModel, context, blueprint, retryFeedback)
      candidate = narrationToCandidate(context, blueprint, narration)
      escalationUsed = true
      validationErrors = validateCandidate(context, candidate)
      if (validationErrors.length > 0) {
        lastFailureClass = 'validation'
        trace.push(`escalation-validation:${validationErrors.join(',')}[${candidateValidationMetrics(candidate).join(',')}]`)
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 240) : 'provider_error'
      lastFailureClass = providerFailureClass(reason)
      trace.push(`escalation:${lastFailureClass}`)
    }
  }

  if (validationErrors.length > 0) lastFailureClass = lastFailureClass === 'unknown' ? 'validation' : lastFailureClass

'''
index = index[:start] + new_block + index[end:]
# Add retry + normalized-key observability to common post-narration metadata blocks and success.
index = index.replace(
"      'X-QISSA-Generation-Repair': repairUsed ? 'text-length' : 'none',\n      'X-QISSA-Escalation-Used': escalationUsed ? 'true' : 'false',\n",
"      'X-QISSA-Generation-Repair': repairUsed ? 'text-length' : 'none',\n      'X-QISSA-Narrator-Retry-Used': narratorRetryUsed ? 'true' : 'false',\n      'X-QISSA-Escalation-Used': escalationUsed ? 'true' : 'false',\n"
)
index = index.replace(
"      'X-QISSA-Provider-Calls': String(providerCalls),\n    })\n  }\n\n  const ruleFlags",
"      'X-QISSA-Provider-Calls': String(providerCalls),\n      'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),\n    })\n  }\n\n  const ruleFlags"
)
index = index.replace(
"        'X-QISSA-Provider-Calls': String(providerCalls),\n        'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),\n",
"        'X-QISSA-Provider-Calls': String(providerCalls),\n        'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),\n",
1
)
index_path.write_text(index)

arch = arch_path.read_text()
arch = arch.replace(
"  const target = context.ageGroup === '5-7' && context.storyMode === 'series' && context.storyMood === 'bedtime'\n    ? context.episodeIndex === 1 ? '470-520' : '390-470'\n    : `${Math.min(maximumWords - 10, minimumWords + 40)}-${Math.max(minimumWords + 40, maximumWords - 20)}`\n",
"  const target = context.ageGroup === '5-7' && context.storyMode === 'series' && context.storyMood === 'bedtime'\n    ? context.episodeIndex === 1 ? '485-525' : '400-470'\n    : `${Math.min(maximumWords - 10, minimumWords + 40)}-${Math.max(minimumWords + 40, maximumWords - 20)}`\n  const paragraphBudget = context.ageGroup === '5-7' && context.storyMode === 'series' && context.storyMood === 'bedtime'\n    ? context.episodeIndex === 1\n      ? { target_paragraphs: 7, average_words_per_paragraph: '65-75', final_choice_setup_words: '55-75' }\n      : { target_paragraphs: '6-7', average_words_per_paragraph: '60-70', final_coda_words: '50-90' }\n    : null\n"
)
arch = arch.replace(
"    'Follow the blueprint beat order. Every one or two short paragraphs should contain action, dialogue, discovery, reaction, attempt, humor or cause-and-effect.',\n",
"    'Follow the blueprint beat order. Every one or two short paragraphs should contain action, dialogue, discovery, reaction, attempt, humor or cause-and-effect.',\n    'For ages 5-7 bedtime series, treat paragraph_budget as a quantitative drafting plan. Do not compress several blueprint beats into a few very short paragraphs; hit the requested total through meaningful beat development, not filler.',\n"
)
arch = arch.replace(
"    target_story_words: target,\n    counting_scope: 'Whitespace-separated words in story_text only.',\n",
"    target_story_words: target,\n    paragraph_budget: paragraphBudget,\n    counting_scope: 'Whitespace-separated words in story_text only.',\n"
)
arch_path.write_text(arch)

check = check_path.read_text()
check = check.replace(
"  \"'X-QISSA-Provider-Calls'\",\n",
"  \"'X-QISSA-Provider-Calls'\",\n  \"'X-QISSA-Narrator-Retry-Used'\",\n  'narratorRetryUsed = true',\n  'Previous narration failed deterministic validation',\n"
)
check = check.replace(
"  \"target_story_words: target\",\n",
"  \"target_story_words: target\",\n  'paragraph_budget: paragraphBudget',\n  \"target_paragraphs: 7\",\n"
)
check_path.write_text(check)
