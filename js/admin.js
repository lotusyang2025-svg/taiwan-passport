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
    
    let h1 = "<b>⏳ 待核可點數：</b><table>";
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
               <td><button onclick="approveP('${i.id}')">核可</button> <button onclick="rejectP('${i.id}')">退回</button></td></tr>`;
      }
    } else {
      h1 += "<tr><td colspan='2' style='text-align:center;'>目前無待審核點數</td></tr>";
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

    let h2 = "<b>🎁 待發放獎勵：</b><table>";
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
               <td><button onclick="approveR('${i.id}')">發獎</button> <button onclick="rejectR('${i.id}')">退回</button></td></tr>`;
      }
    } else {
      h2 += "<tr><td colspan='2' style='text-align:center;'>目前無待領取獎勵</td></tr>";
    }
    $("pendingList").innerHTML = h2 + "</table>";

  } catch (e) {
    console.error("管理員數據載入嚴重錯誤:", e);
    $("pendingList").innerHTML = "系統異常，請刷新頁面或檢查資料庫連接。";
  }
}

window.rejectR = async (id) => {
  const r = prompt("退回原因："); 
  if (r) await sb.from("redemptions").update({ status: 'rejected', admin_comment: r }).eq("id", id); 
  refreshAll();
};

window.rejectP = async (id) => {
  const r = prompt("退回原因："); 
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