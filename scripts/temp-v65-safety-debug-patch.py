from pathlib import Path

src = Path('supabase/functions/story-generate/split-index.ts').read_text()
old = """    if (!safety.approved) {
      lastFailureClass = 'semantic-safety'
      const flags = Object.entries(safety.flags).filter(([, value]) => value).map(([key]) => key)
      trace.push(`semantic-safety:${flags.join(',') || safety.required_action}`)
      return safeFallback(context, origin, 'generation-or-safety-failed', {
        ...runtimeProviderMetadata,
        ...claimMetadata(claim),
        'X-QISSA-Generation-Failure-Class': lastFailureClass,
        'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
        'X-QISSA-Generation-Repair': repairUsed ? 'text-length' : 'none',
        'X-QISSA-Escalation-Used': escalationUsed ? 'true' : 'false',
        'X-QISSA-Narrator-Model-Used': narratorModelUsed,
        'X-QISSA-Provider-Calls': String(providerCalls),
        'X-QISSA-Initial-Story-Words': String(initialStoryWords),
        'X-QISSA-Final-Story-Words': String(wordCount(candidate.story_text)),
      })
    }
"""
new = """    if (!safety.approved) {
      lastFailureClass = 'semantic-safety'
      const flags = Object.entries(safety.flags).filter(([, value]) => value).map(([key]) => key)
      trace.push(`semantic-safety:${flags.join(',') || safety.required_action}`)
      return json({
        audit_debug: true,
        candidate,
        semantic_evaluation: evaluation,
        moderation,
        combined_safety: safety,
        trace,
      }, 200, origin, {
        ...runtimeProviderMetadata,
        ...claimMetadata(claim),
        'X-QISSA-Generation-Source': 'audit-debug',
        'X-QISSA-Generation-Failure-Class': lastFailureClass,
        'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
        'X-QISSA-Generation-Repair': repairUsed ? 'text-length' : 'none',
        'X-QISSA-Narrator-Retry-Used': narratorRetryUsed ? 'true' : 'false',
        'X-QISSA-Escalation-Used': escalationUsed ? 'true' : 'false',
        'X-QISSA-Narrator-Model-Used': narratorModelUsed,
        'X-QISSA-Provider-Calls': String(providerCalls),
        'X-QISSA-Initial-Story-Words': String(initialStoryWords),
        'X-QISSA-Final-Story-Words': String(wordCount(candidate.story_text)),
      })
    }
"""
if src.count(old) != 1:
    raise SystemExit(f'semantic failure block match count={src.count(old)}')
Path('supabase/functions/story-generate/audit-debug.ts').write_text(src.replace(old, new, 1))
