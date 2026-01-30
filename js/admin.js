// 🛡️ 管理員功能模組
// 不 embed 關聯表，避免「more than one relationship」錯誤；只查本表，用 task_code / reward_id、user_id 顯示
async function loadAdminData() {
  try {
    let { data: pts, error: pErr } = await sb.from("point_events")
      .select("id, user_id, mission_id, task_code, points, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    
    if (pErr) {
      console.warn("待審核點數查詢異常:", pErr.message);
      pts = null;
    }
    
    let h1 = "<b>⏳ Pending points:</b><table>";
    if (pts && pts.length > 0) {
      for (const i of pts) {
        let taskLabel = i.task_code || i.mission_id || "—";
        let userLabel = i.user_id ? i.user_id.slice(0, 8) + "…" : "—";
        try {
          const { data: mission } = await sb.from("missions").select("title").eq("id", i.mission_id).maybeSingle();
          if (mission?.title) taskLabel = mission.title;
        } catch (_) {}
        try {
          const { data: prof } = await sb.from("profiles").select("email").eq("id", i.user_id).maybeSingle();
          if (prof?.email) userLabel = prof.email;
        } catch (_) {}
        h1 += `<tr><td>${taskLabel}<br><small>${userLabel}</small></td>
               <td><button onclick="approveP('${i.id}')">Approve</button> <button onclick="rejectP('${i.id}')">Reject</button></td></tr>`;
      }
    } else {
      h1 += "<tr><td colspan='2' style='text-align:center;'>No pending points</td></tr>";
    }
    $("pendingPointsList").innerHTML = h1 + "</table>";

    let { data: rds, error: rErr } = await sb.from("redemptions")
      .select("id, user_id, reward_id, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    
    if (rErr) {
      console.warn("待發放獎勵查詢異常:", rErr.message);
      rds = null;
    }

    let h2 = "<b>🎁 Pending rewards:</b><table>";
    if (rds && rds.length > 0) {
      for (const i of rds) {
        let rewardLabel = i.reward_id || "—";
        let userLabel = i.user_id ? i.user_id.slice(0, 8) + "…" : "—";
        try {
          const { data: reward } = await sb.from("rewards").select("title").eq("id", i.reward_id).maybeSingle();
          if (reward?.title) rewardLabel = reward.title;
        } catch (_) {}
        try {
          const { data: prof } = await sb.from("profiles").select("email").eq("id", i.user_id).maybeSingle();
          if (prof?.email) userLabel = prof.email;
        } catch (_) {}
        h2 += `<tr><td>${rewardLabel}<br><small>${userLabel}</small></td>
               <td><button onclick="approveR('${i.id}')">Grant</button> <button onclick="rejectR('${i.id}')">Reject</button></td></tr>`;
      }
    } else {
      h2 += "<tr><td colspan='2' style='text-align:center;'>No pending rewards</td></tr>";
    }
    $("pendingList").innerHTML = h2 + "</table>";

  } catch (e) {
    console.error("管理員數據載入嚴重錯誤:", e);
    $("pendingList").innerHTML = "System error. Please refresh or check database connection.";
  }

  if (window.isSuperAdmin) {
    loadAdminList();
  }
}

async function loadAdminList() {
  const container = $("adminListContainer");
  if (!container) return;
  try {
    const { data, error } = await sb.rpc("get_admin_list");
    if (error) {
      container.innerHTML = `<p style="color:#f87171;">無法載入：${error.message}</p>`;
      return;
    }
    if (!data || data.length === 0) {
      container.innerHTML = "<p style='color:#94a3b8;'>尚無管理員紀錄</p>";
      return;
    }
    let html = "<table style='width:100%; border-collapse:collapse;'><thead><tr><th style='text-align:left; padding:6px 8px; border-bottom:1px solid #475569; color:#94a3b8;'>Email</th><th style='text-align:left; padding:6px 8px; border-bottom:1px solid #475569; color:#94a3b8;'>Role</th><th style='text-align:left; padding:6px 8px; border-bottom:1px solid #475569; color:#94a3b8;'>狀態</th><th style='text-align:left; padding:6px 8px; border-bottom:1px solid #475569; color:#94a3b8;'>授予時間</th><th style='text-align:left; padding:6px 8px; border-bottom:1px solid #475569; color:#94a3b8;'>操作</th></tr></thead><tbody>";
    for (const row of data) {
      const email = row.email || row.user_id?.slice(0, 8) + "…" || "—";
      const role = row.role || "—";
      const active = row.is_active ? "啟用" : "停用";
      const grantedAt = row.granted_at ? new Date(row.granted_at).toLocaleString("zh-TW", { hour12: false }) : "—";
      const uid = row.user_id ? String(row.user_id) : "";
      const canRevoke = row.role === "admin" && row.is_active === true;
      const actionCell = canRevoke
        ? `<button type="button" class="btn-revoke-admin" data-user-id="${escapeHtml(uid)}" style="padding:4px 10px; border-radius:6px; border:1px solid #f87171; background:transparent; color:#f87171; cursor:pointer; font-size:12px;">停用</button>`
        : "—";
      html += `<tr><td style='padding:6px 8px; border-bottom:1px solid #334155; color:#e2e8f0;'>${escapeHtml(email)}</td><td style='padding:6px 8px; border-bottom:1px solid #334155; color:#cbd5e1;'>${escapeHtml(role)}</td><td style='padding:6px 8px; border-bottom:1px solid #334155;'>${active}</td><td style='padding:6px 8px; border-bottom:1px solid #334155; color:#94a3b8;'>${escapeHtml(grantedAt)}</td><td style='padding:6px 8px; border-bottom:1px solid #334155;'>${actionCell}</td></tr>`;
    }
    html += "</tbody></table>";
    container.innerHTML = "<div style='overflow-x:auto; max-width:100%;'>" + html + "</div>";
    container.querySelectorAll(".btn-revoke-admin").forEach((btn) => {
      btn.addEventListener("click", function () {
        const uid = this.getAttribute("data-user-id");
        if (uid) revokeAdmin(uid);
      });
    });
  } catch (e) {
    console.error("loadAdminList error:", e);
    container.innerHTML = `<p style="color:#f87171;">載入失敗：${e?.message || String(e)}</p>`;
  }
}

function escapeHtml(s) {
  if (s == null) return "";
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

window.addAdminByEmail = async function () {
  const input = $("newAdminEmail");
  const email = input?.value?.trim();
  if (!email) {
    alert("請輸入 Email");
    return;
  }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    alert("請輸入有效的 Email 格式");
    return;
  }
  const btn = $("btnAddAdmin");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "處理中…";
  }
  try {
    const { error } = await sb.rpc("grant_admin", { target_email: email });
    if (error) {
      alert(error.message || "新增失敗");
      return;
    }
    if (typeof showRewardToast === "function") showRewardToast("已新增管理員");
    if (input) input.value = "";
    loadAdminList();
  } catch (e) {
    alert(e?.message || "新增失敗");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "新增管理員";
    }
  }
};

window.revokeAdmin = async function (userId) {
  if (!userId || !confirm("確定要停用此管理員嗎？停用後該使用者將無法使用管理員功能。")) return;
  try {
    const { error } = await sb.rpc("revoke_admin", { target_user_id: userId });
    if (error) {
      alert(error.message || "停用失敗");
      return;
    }
    if (typeof showRewardToast === "function") showRewardToast("已停用管理員");
    loadAdminList();
  } catch (e) {
    alert(e?.message || "停用失敗");
  }
};

(function () {
  const btn = document.getElementById("btnAddAdmin");
  if (btn) btn.addEventListener("click", () => window.addAdminByEmail());
})();

window.rejectR = async (id) => {
  const r = prompt("Rejection reason:"); 
  if (r) await sb.from("redemptions").update({ status: 'rejected', admin_comment: r }).eq("id", id); 
  refreshAll();
};

window.rejectP = async (id) => {
  const r = prompt("Rejection reason:"); 
  if (r) await sb.from("point_events").update({ status: 'rejected', admin_comment: r }).eq("id", id); 
  refreshAll();
};

window.approveP = async (id) => { 
  await sb.from("point_events").update({status:'approved'}).eq("id",id); 
  refreshAll(); 
};  

window.approveR = async (id) => { 
  await sb.from("redemptions").update({status:'approved'}).eq("id",id); 
  refreshAll(); 
};