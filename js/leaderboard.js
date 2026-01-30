// Leaderboard: top N by approved points (requires Supabase RPC get_leaderboard).

const LEADERBOARD_LIMIT = 10;

async function loadLeaderboard() {
  const el = document.getElementById("leaderboardList");
  if (!el) return;

  el.textContent = "Loading...";

  try {
    const { data: session } = await sb.auth.getSession();
    const currentUserId = session?.data?.session?.user?.id || null;

    const { data: rows, error } = await sb.rpc("get_leaderboard", { limit_n: LEADERBOARD_LIMIT });

    if (error) {
      console.error("Leaderboard RPC error:", error);
      el.innerHTML = '<p class="text-red-400">Failed to load leaderboard. Run <code>docs/get_leaderboard_rpc.sql</code> in Supabase if not done yet.</p>';
      return;
    }

    if (!rows || rows.length === 0) {
      el.innerHTML = '<p class="text-slate-400">No rankings yet. Complete missions to earn points.</p>';
      return;
    }

    let table = `
      <table class="leaderboard-table" style="width:100%; border-collapse:collapse; font-size:14px;">
        <thead>
          <tr>
            <th style="text-align:left; padding:10px 8px; border-bottom:2px solid #475569; color:#94a3b8;">Rank</th>
            <th style="text-align:left; padding:10px 8px; border-bottom:2px solid #475569; color:#94a3b8;">Name</th>
            <th style="text-align:right; padding:10px 8px; border-bottom:2px solid #475569; color:#94a3b8;">Points</th>
          </tr>
        </thead>
        <tbody>
    `;
    rows.forEach((r) => {
      const isYou = currentUserId && r.user_id === currentUserId;
      const rowClass = isYou ? "leaderboard-row-you" : "";
      table += `
        <tr class="${rowClass}" style="border-bottom:1px solid #334155;">
          <td style="padding:10px 8px; color:#e2e8f0;">${r.rank}</td>
          <td style="padding:10px 8px; color:#e2e8f0;">${escapeHtml(r.display_name || "Anonymous")}</td>
          <td style="padding:10px 8px; text-align:right; color:#34d399; font-weight:600;">${r.total_points} pt</td>
        </tr>
      `;
    });
    table += "</tbody></table>";
    el.innerHTML = table;
  } catch (e) {
    console.error("loadLeaderboard error:", e);
    el.innerHTML = '<p class="text-red-400">Failed to load leaderboard.</p>';
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
