import re

with open('src/stores/playerStore.ts', 'r') as f:
    content = f.read()

# Replace startPolling body
new_polling = '''
  startPolling: () => {
    if (pollingInterval) return;
    pollingInterval = window.setInterval(async () => {
      try {
        const position: number = await invoke("local_get_position");
        set({ progressMs: position });
      } catch (e) {
        // Suppress polling errors to avoid console spam when not connected
      }
    }, 1000);
  },
'''

content = re.sub(r'\s*startPolling: \(\) => \{[\s\S]*?\}, 1000\);\n  \},', new_polling, content)

# Remove the junk at the end
content = re.sub(r'\s*// ── Spotify Auth ─────────────────────────────────────────────[\s\S]*', '\n}));', content)

# Fix { mode } = get() if it's there
content = re.sub(r'const \{ mode, .*?\} = get\(\);', 'const { progressMs } = get();', content)
content = re.sub(r'const \{ mode, .*?\}', 'const { ', content)

with open('src/stores/playerStore.ts', 'w') as f:
    f.write(content)
