# 📋 ClaimCheck — The document that proves itself

**Paste any document with numbers, percentages, or dates. AI extracts the claims. A deterministic engine proves or disproves every one of them.**

Built for [Anna AI-Native App Hackathon](https://dorahacks.io/hackathon/anna-ai-native-app/detail)

---

## 🎯 What it does
- 📄 Paste any document: invoice, contract, expense report, email
- 🤖 AI extracts every numerical claim (sums, percentages, dates, ratios)
- ✅ A deterministic Executa (pure Python, zero deps) recomputes and verifies each claim — no LLM hallucination possible in the verdict
- 🟢🔴 Shows VERIFIED or DISPUTED for every claim, with the exact computed value vs claimed value
- 💾 Save verification history to archive (`anna.storage`)

**The model proposes the claims. The engine proves them.**

---

## 🚀 How to run locally

```bash
git clone https://github.com/ffffffffhugfadil/claimcheck-anna-app.git
cd claimcheck-anna-app
anna-app validate --strict
anna-app dev --no-llm
```

Open the dashboard URL printed in the terminal (e.g. `http://localhost:5180/`). Click a sample, then "Examine document →".

---

## 📁 Project structure
```
claimcheck-anna-app/
├── manifest.json                       # Anna App manifest (schema 2)
├── app.json                            # Store listing metadata
├── bundle/
│   ├── index.html                      # UI entry — forensic "claim audit" visual identity
│   └── app.js                          # Wires UI to the real AnnaAppRuntime SDK
└── executas/
    └── claimcheck/
        ├── claimcheck_plugin.py        # Deterministic verifier Executa
        └── pyproject.toml
```

---

## 🛠️ The Executa — `tool-dev-claimcheck`

Six JSON-RPC methods, every one returning the dispatcher contract `{"success": true, "data": {...}}`:

| Method | What it verifies |
|---|---|
| `check_sum` | A list of parts sums to a claimed total |
| `check_percentage` | percent% of a base equals a claimed result |
| `check_date_range` | Day-count between two dates matches a claimed number of days |
| `check_ratio` | numerator/denominator matches a claimed ratio |
| `verify_batch` | Runs a full batch of mixed claims in one call (what the UI uses) |
| `ping` | Smoke test |

Verify it directly, no Anna host needed:
```bash
cd executas/claimcheck
echo '{"jsonrpc":"2.0","id":1,"method":"describe"}' | python3 claimcheck_plugin.py
```

---

## 🛠️ Built with
- **Anna App Runtime** — UI host API (`tools.invoke`, `storage.get/set`, `window.set_title`)
- **Executa Protocol** — JSON-RPC 2.0 over stdio
- **Python** (stdlib only) — deterministic verification engine
- **JavaScript** — UI + AnnaAppRuntime SDK integration

---

## ⚠️ Known limitations
- Claim extraction currently runs from built-in samples + a small local regex fallback, not yet wired to `anna.llm.complete` — pending confirmation of that host API's exact shape during the hackathon window.
- App Store publishing requires Verified Developer status, which is admin-granted and has no self-service flow; this submission runs via `anna-app dev` (local harness) per the hackathon's accepted "local run instructions" submission format.

---

## 📹 Demo video
[Link YouTube — coming soon]

---

## 🏆 Hackathon submission
**Track:** Anna AI-Native App Hackathon
**Category:** Productivity
**Judging criteria:** Usefulness, Working demo, Meaningful AI use, Fit with Anna, Creativity

| Criterion | How ClaimCheck delivers |
|---|---|
| Usefulness | Universal pain point — nobody re-checks the arithmetic in invoices, contracts, or expense reports |
| Working demo | Runs locally via `anna-app dev --no-llm`, fully reproducible with built-in samples |
| Meaningful AI | AI does the genuinely hard part (structuring ambiguous prose into typed claims); deterministic code does the part that must never hallucinate |
| Fit with Anna | Real Executa (JSON-RPC over stdio) + Manifest v2 + `AnnaAppRuntime` SDK (`tools.invoke`, `storage`, `window`) |
| Creativity | Generalizes the "model proposes, engine proves" trust pattern beyond a single use case to any document with numbers in it |

---

## 📝 License
MIT

Built with ❤️ for Anna Hackathon 2026
