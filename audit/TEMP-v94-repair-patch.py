from pathlib import Path
p=Path('supabase/functions/story-generate/prompt.ts')
s=p.read_text(encoding='utf-8')
def replace_exact(old,new):
    global s
    actual=s.count(old)
    if actual!=1:
        raise SystemExit(f'V94_PATCH_GUARD_FAILED: expected 1 occurrence; actual={actual}')
    s=s.replace(old,new,1)
replace_exact(
    '  const desiredExpandedTotal = Math.min(maximumStoryWords - 25, minimumStoryWords + 45)\n',
    '  // v94: only a verified underlength Repair RETRY gets extra length headroom.\n'
    '  // Feedback comes from our own deterministic validator, never from child-provided text.\n'
    '  const previousRepairWordsMatch = /Rejected repair metrics: story_words=(\\d{1,4})(?:,|\\.)/u.exec(retryFeedback)\n'
    '  const previousRepairWords = previousRepairWordsMatch ? Number(previousRepairWordsMatch[1]) : null\n'
    '  const repeatedUnderlength = storyTooShort && !fullStoryRewrite && previousRepairWords !== null && previousRepairWords < minimumStoryWords\n'
    '  const desiredExpandedTotal = Math.min(maximumStoryWords - 25, minimumStoryWords + (repeatedUnderlength ? 80 : 45))\n',
)
replace_exact(
    "        : 'For a choice-resolution-only repair, return title_rewrite, story_rewrite and story_expansion as null. Return only the exact choice_resolutions listed in repair_plan; do not insert into, rewrite or otherwise alter story_text.',\n",
    "        : 'For a choice-resolution-only repair, return title_rewrite, story_rewrite and story_expansion as null. Return only the exact choice_resolutions listed in repair_plan; do not insert into, rewrite or otherwise alter story_text.',\n"
    "    repeatedUnderlength\n"
    "      ? `The previous Repair returned only ${previousRepairWords} story_text words, below the hard minimum ${minimumStoryWords}. Count words separated by whitespace in NEW story_expansion itself. Write at least ${expansionMinimum} and aim ${expansionMinimum}-${expansionMaximum} NEW words before returning the response; the server inserts this passage into the original story. Develop only existing pre-choice character actions, dialogue and reactions without padding, repeating scenes, performing a choice or inventing another problem.`\n"
    "      : '',\n",
)
replace_exact(
    "            desired_total_after_insertion: desiredExpandedTotal,\n            target_additional_words: `${expansionMinimum}-${expansionMaximum}`,\n",
    "            desired_total_after_insertion: desiredExpandedTotal,\n"
    "            target_additional_words: `${expansionMinimum}-${expansionMaximum}`,\n"
    "            absolute_minimum_additional_words: Math.max(0, minimumStoryWords - currentStoryWords),\n"
    "            retry_previous_story_words: repeatedUnderlength ? previousRepairWords : null,\n"
    "            retry_remaining_deficit_words: repeatedUnderlength && previousRepairWords !== null ? minimumStoryWords - previousRepairWords : null,\n"
    "            counting_scope: 'Count whitespace-delimited words only inside NEW story_expansion. Metadata, choice resolutions, state patches and vocabulary do not count toward story_text.',\n",
)
p.write_text(s,encoding='utf-8')
print('V94_SCOPED_PATCH_COMPLETE: exact 3 guarded source replacements; only verified repeated E1 underlength gets a bounded larger target.')
