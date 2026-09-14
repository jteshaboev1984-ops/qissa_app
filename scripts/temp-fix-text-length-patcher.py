from pathlib import Path

p = Path('scripts/temp-apply-text-length-repair.py')
text = p.read_text()
old = """replace_once(index, \"'X-QISSA-Generation-Repair': usedLengthRepair ? 'story-length' : 'none'\", \"'X-QISSA-Generation-Repair': usedTextLengthRepair ? 'text-length' : 'none'\")
replace_once(index, \"'X-QISSA-Generation-Repair': usedLengthRepair ? 'story-length' : 'none'\", \"'X-QISSA-Generation-Repair': usedTextLengthRepair ? 'text-length' : 'none'\")"""
new = """repair_header_old = \"'X-QISSA-Generation-Repair': usedLengthRepair ? 'story-length' : 'none'\"
repair_header_new = \"'X-QISSA-Generation-Repair': usedTextLengthRepair ? 'text-length' : 'none'\"
index_path = Path(index)
index_text = index_path.read_text()
if index_text.count(repair_header_old) != 2:
    raise SystemExit(f'{index}: expected 2 repair header matches, got {index_text.count(repair_header_old)}')
index_path.write_text(index_text.replace(repair_header_old, repair_header_new))"""
if text.count(old) != 1:
    raise SystemExit(f'expected exactly one duplicate repair-header block, got {text.count(old)}')
p.write_text(text.replace(old, new))
