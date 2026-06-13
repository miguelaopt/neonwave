import re

with open('src/stores/playerStore.ts', 'r') as f:
    content = f.read()

# I see a bunch of junk from lines 191 onwards
content = re.sub(r'\s*// ── Spotify Auth.*?\n', '', content)
content = re.sub(r'\s*\} catch \(e\) \{\n\s*console.error\("Check auth error.*', '', content, flags=re.DOTALL)

with open('src/stores/playerStore.ts', 'w') as f:
    f.write(content + "\n}));")
