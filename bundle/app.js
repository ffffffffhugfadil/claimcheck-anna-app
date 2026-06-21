// ClaimCheck bundle entry — wired to the real Anna App SDK.
import { AnnaAppRuntime } from "/static/anna-apps/_sdk/latest/index.js";

const TOOL_ID = "tool-dev-claimcheck";

// Built-in samples for the extraction step. Real anna.llm-based extraction
// is the next integration step once the host LLM API surface is confirmed —
// see the note in index.html. Verification below is never simulated: it
// always calls the real claimcheck Executa via anna.tools.invoke.
const SAMPLES = {
  invoice: {
    text: `Invoice #1042 — Atelier Studio
Line items: Design consult $15, Asset delivery $20, Revision pass $12.
Subtotal: $47.
Agreement period: 14 days, from 2026-06-01 to 2026-06-15.
Budget utilization this quarter: $47 spent out of a $100 cap (ratio 0.47).`,
    claims: [
      { id: "c1", type: "check_sum", claim_text: "Subtotal of 3 line items ($15 + $20 + $12) = $47", args: { parts: [15, 20, 12], claimed_total: 47 } },
      { id: "c2", type: "check_date_range", claim_text: "Agreement period of 14 days, June 1 to June 15, 2026", args: { start: "2026-06-01", end: "2026-06-15", claimed_days: 14 } },
      { id: "c3", type: "check_ratio", claim_text: "Budget utilization ratio: $47 of $100 = 0.47", args: { numerator: 47, denominator: 100, claimed_ratio: 0.47 } },
    ],
  },
  contract: {
    text: `Service Agreement, Clause 4.2 — Term and Renewal
The initial term runs 30 days, beginning 2026-07-01 and ending 2026-07-31.
Early termination fee equals 15% of the remaining contract value of $2,400, totaling $360.
Three milestone payments of $800, $800, and $800 sum to the full contract value of $2,400.`,
    claims: [
      { id: "c1", type: "check_date_range", claim_text: "Initial term of 30 days, July 1 to July 31, 2026", args: { start: "2026-07-01", end: "2026-07-31", claimed_days: 30 } },
      { id: "c2", type: "check_percentage", claim_text: "Early termination fee: 15% of $2,400 = $360", args: { base: 2400, percent: 15, claimed_result: 360 } },
      { id: "c3", type: "check_sum", claim_text: "Three $800 milestones sum to $2,400 contract value", args: { parts: [800, 800, 800], claimed_total: 2400 } },
    ],
  },
  bad: {
    text: `Expense Report — Q2 Field Trip
Receipts: $22.50 (fuel), $14.75 (tolls), $9.00 (parking) — total claimed: $50.00.
Reimbursement rate: 10% admin fee added to $50.00 — fee amount claimed as $52.50.
Trip duration: 5 days, from 2026-06-10 to 2026-06-14, claimed as 5 days.
Mileage ratio: 312 miles out of a 300-mile budget, reported as 0.96 utilization.`,
    claims: [
      { id: "c1", type: "check_sum", claim_text: "Three receipts ($22.50 + $14.75 + $9.00) total $50.00", args: { parts: [22.5, 14.75, 9.0], claimed_total: 50.0 } },
      { id: "c2", type: "check_percentage", claim_text: "10% admin fee on $50.00 claimed as $52.50 (wrong — that's not the fee amount)", args: { base: 50, percent: 10, claimed_result: 52.5 } },
      { id: "c3", type: "check_date_range", claim_text: "Trip duration of 5 days, June 10 to June 14, 2026", args: { start: "2026-06-10", end: "2026-06-14", claimed_days: 5 } },
      { id: "c4", type: "check_ratio", claim_text: "Mileage utilization: 312 of 300 miles = 0.96", args: { numerator: 312, denominator: 300, claimed_ratio: 0.96 } },
    ],
  },
};

function extractClaims(text) {
  const trimmed = text.trim();
  for (const key of Object.keys(SAMPLES)) {
    if (SAMPLES[key].text.trim() === trimmed) return SAMPLES[key].claims;
  }
  // Light local fallback for arbitrary pasted text (no LLM wired yet).
  const claims = [];
  let idx = 1;
  const sumRe = /\$?(\d+(?:\.\d+)?)(?:\s*,\s*\$?(\d+(?:\.\d+)?))+.*?(?:total|totals|sum|subtotal)[^\d]{0,15}\$?(\d+(?:\.\d+)?)/gi;
  let m;
  while ((m = sumRe.exec(text)) !== null) {
    const nums = m[0].match(/\$?\d+(?:\.\d+)?/g).map((s) => parseFloat(s.replace("$", "")));
    claims.push({ id: `h${idx++}`, type: "check_sum", claim_text: m[0].trim().slice(0, 90), args: { parts: nums.slice(0, -1), claimed_total: nums[nums.length - 1] } });
  }
  return claims;
}

const RING_CIRCUMFERENCE = 2 * Math.PI * 27;
let currentRun = null;

function renderClaimCard(r) {
  const div = document.createElement("div");
  let stampClass = "unverifiable", stampText = "N/A", cardClass = "", numbersHtml = "";
  if (!r.ok) {
    numbersHtml = `<span>${r.error || "could not parse"}</span>`;
  } else if (r.match) {
    stampClass = "pass"; cardClass = "pass"; stampText = "VERIFIED";
    numbersHtml = r.type === "check_date_range"
      ? `<span>computed: <b>${r.computed_days} days</b></span><span>claimed: <b>${r.claimed_days} days</b></span>`
      : `<span>computed: <b>${r.computed}</b></span><span>claimed: <b>${r.claimed}</b></span>`;
  } else {
    stampClass = "fail"; cardClass = "fail"; stampText = "DISPUTED";
    numbersHtml = r.type === "check_date_range"
      ? `<span>computed: <b>${r.computed_days} days</b></span><span>claimed: <b>${r.claimed_days} days</b></span>`
      : `<span>computed: <b>${r.computed}</b></span><span>claimed: <b>${r.claimed}</b></span><span class="delta-fail">off by ${Math.abs(parseFloat(r.delta || 0))}</span>`;
  }
  div.className = `claim-card ${cardClass}`;
  div.innerHTML = `<div class="stamp ${stampClass}">${stampText}</div><div class="claim-body"><div class="claim-text">${r.claim_text || "(claim)"}</div><div class="claim-numbers">${numbersHtml}</div></div>`;
  return div;
}

function animateRing(verified, total) {
  const pct = total > 0 ? verified / total : 0;
  const offset = RING_CIRCUMFERENCE * (1 - pct);
  const ring = document.getElementById("ringProgress");
  ring.style.transition = "stroke-dashoffset 0.7s ease, stroke 0.3s ease";
  ring.style.strokeDashoffset = String(offset);
  ring.style.stroke = pct === 1 ? "#2f6b4f" : pct === 0 ? "#a6342a" : "#b8923f";
  document.getElementById("ringScore").textContent = `${verified} / ${total}`;
}

async function main() {
  const status = document.getElementById("connStatus");
  const docInput = document.getElementById("docInput");
  const examineBtn = document.getElementById("examineBtn");
  const verdictStrip = document.getElementById("verdictStrip");
  const claimsList = document.getElementById("claimsList");
  const saveBtn = document.getElementById("saveBtn");
  const discardBtn = document.getElementById("discardBtn");
  const archiveList = document.getElementById("archiveList");

  let anna;
  try {
    anna = await AnnaAppRuntime.connect();
    status.textContent = "connected";
  } catch (e) {
    status.textContent = "standalone (no host)";
  }

  if (anna) await anna.window.set_title({ title: "ClaimCheck" });

  document.querySelectorAll(".sample-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      docInput.value = SAMPLES[btn.dataset.sample].text;
      verdictStrip.classList.remove("show");
      currentRun = null;
    });
  });

  async function loadArchive() {
    if (!anna) return;
    let archive = [];
    try {
      const res = await anna.storage.get({ key: "claimcheck:archive" });
      archive = res?.value ? JSON.parse(res.value) : [];
    } catch (e) { archive = []; }
    if (archive.length === 0) {
      archiveList.innerHTML = `<div class="empty-archive">No examined documents yet.</div>`;
      return;
    }
    archiveList.innerHTML = "";
    archive.slice().reverse().forEach((entry) => {
      const div = document.createElement("div");
      div.className = "archive-item";
      div.innerHTML = `<span>${entry.preview}</span><span class="score">${entry.verified}/${entry.total}</span>`;
      archiveList.appendChild(div);
    });
  }

  examineBtn.addEventListener("click", async () => {
    const text = docInput.value.trim();
    if (!text || !anna) return;
    examineBtn.disabled = true;
    examineBtn.textContent = "Verifying with deterministic engine…";
    try {
      const claims = extractClaims(text);
      const out = await anna.tools.invoke({ tool_id: TOOL_ID, method: "verify_batch", args: { claims } });
      if (!out.success) throw new Error(out.error || "verify_batch failed");
      const verdict = out.data;
      currentRun = { text, verdict };

      claimsList.innerHTML = "";
      if (verdict.results.length === 0) {
        claimsList.innerHTML = `<div class="claim-text" style="color:var(--ink-soft); font-style:italic;">No checkable claims found in this text.</div>`;
      } else {
        verdict.results.forEach((r) => claimsList.appendChild(renderClaimCard(r)));
      }
      animateRing(verdict.verified_count, verdict.total_count);
      verdictStrip.classList.add("show");
      await anna.window.set_title({ title: `ClaimCheck — ${verdict.verified_count}/${verdict.total_count} verified` });
    } catch (e) {
      claimsList.innerHTML = `<div class="claim-text">Error: ${e.message}</div>`;
      verdictStrip.classList.add("show");
    } finally {
      examineBtn.disabled = false;
      examineBtn.textContent = "Examine document →";
    }
  });

  saveBtn.addEventListener("click", async () => {
    if (!currentRun || !anna) return;
    let archive = [];
    try {
      const res = await anna.storage.get({ key: "claimcheck:archive" });
      archive = res?.value ? JSON.parse(res.value) : [];
    } catch (e) { archive = []; }
    archive.push({
      preview: currentRun.text.slice(0, 60).replace(/\s+/g, " ") + "…",
      verified: currentRun.verdict.verified_count,
      total: currentRun.verdict.total_count,
      savedAt: new Date().toISOString(),
    });
    await anna.storage.set({ key: "claimcheck:archive", value: JSON.stringify(archive) });
    await loadArchive();
    saveBtn.textContent = "Saved ✓";
    setTimeout(() => { saveBtn.textContent = "Save to archive"; }, 1400);
  });

  discardBtn.addEventListener("click", () => {
    verdictStrip.classList.remove("show");
    currentRun = null;
  });

  await loadArchive();
}

main();
