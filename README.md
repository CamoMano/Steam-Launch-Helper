# Steam Launch Helper

Small static web tool to build Steam launch options (flags and Proton/DXVK env vars).

Quick start
- Serve locally: `python -m http.server 8000` (or use VS Code Live Server)
- Open: `http://localhost:8000/`

How it works
- `steam.json` defines categories and flags; `script.js` loads and renders them, `updateOutput()` builds the final string.
- Flags in the `Proton & DXVK` category are treated as env vars and placed before `%command%`.

Add flags
- Edit `steam.json` entries (`flag`, `type`, `label`, `description`). IDs are sanitized from category+flag—avoid collisions.
