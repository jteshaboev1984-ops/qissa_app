from pathlib import Path

routing = Path('supabase/functions/story-generate/repair-routing.ts')
text = routing.read_text()
old = "export const textRepairShouldRepairAllChoiceResolutions = (errors: string[]): boolean =>\n  textRepairShouldRewriteAllChoiceResolutions(errors) || errors.includes('choice_resolution_defers_to_future_session')\n"
new = "export const textRepairShouldRepairAllChoiceResolutions = (errors: string[]): boolean =>\n  textRepairShouldRewriteAllChoiceResolutions(errors) ||\n  errors.includes('choice_resolution_defers_to_future_session') ||\n  errors.includes('invalid_resolution_text')\n"
if old not in text:
    raise SystemExit('choice resolution repair routing fragment missing')
routing.write_text(text.replace(old, new, 1))

check = Path('scripts/check-story-ai-split.mjs')
text = check.read_text()
old_import = "import { isTextRepairEligibleFailure, textRepairRequiresFullStoryRewrite, textRepairableValidationErrors } from '../supabase/functions/story-generate/repair-routing.ts'\n"
new_import = "import { isTextRepairEligibleFailure, textRepairRequiresFullStoryRewrite, textRepairableValidationErrors, textRepairShouldRepairAllChoiceResolutions } from '../supabase/functions/story-generate/repair-routing.ts'\n"
if old_import not in text:
    raise SystemExit('generated repair routing import missing')
text = text.replace(old_import, new_import, 1)
anchor = "requireLanguageGuard(textRepairRequiresFullStoryRewrite(repairRouteContext, ['story_too_long']), 'Episode 1 story_too_long must use full rewrite because insertion cannot shorten prose')\n"
addition = anchor + "requireLanguageGuard(textRepairShouldRepairAllChoiceResolutions(['invalid_resolution_text']), 'malformed resolution text must target the structured choice resolution rather than no-op repair')\n"
if anchor not in text:
    raise SystemExit('repair routing assertion anchor missing')
check.write_text(text.replace(anchor, addition, 1))
print('v74 malformed resolution repair routing covered')
