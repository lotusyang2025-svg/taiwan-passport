// 🛡️ 管理員功能模組
async function loadAdminData() {
  try {
    let { data: pts, error: pErr } = await sb.from("point_events")
      .select("*, missions(title), profiles(email)")
      .eq("status", "pending");
    
    if (pErr && pErr.message.includes("relationship")) {
      console.warn("點數表關聯異常，切換至基本模式");
      let { data: basicPts } = await sb.from("point_events")
        .select("*, missions(title)")
        .eq("status", "pending");
      pts = basicPts;
    }
    
    let h1 = "<b>⏳ 待核可點數：</b><table>";
    if (pts && pts.length > 0) {
      pts.forEach(i => {
        h1 += `<tr><td>${i.missions?.title || i.task_code}<br><small>${i.profiles?.email || '學生ID: ' + i.user_id.slice(0,8)}</small></td>
               <td><button onclick="approveP('${i.id}')">核可</button> <button onclick="rejectP('${i.id}')">退回</button></td></tr>`;
      });
    } else { h1 += "<tr><td colspan='2' style='text-align:center;'>目前無待審核點數</td></tr>"; }
    $("pendingPointsList").innerHTML = h1 + "</table>";

    let { data: rds, error: rErr } = await sb.from("redemptions")
      .select("*, rewards(title), profiles(email)")
      .eq("status", "pending");
    
    if (rErr && rErr.message.includes("relationship")) {
      console.warn("獎勵表關聯異常，切換至基本模式");
      let { data: basicRds } = await sb.from("redemptions")
        .select("*, rewards(title)")
        .eq("status", "pending");
      rds = basicRds;
    }

    let h2 = "<b>🎁 待發放獎勵：</b><table>";
    if (rds && rds.length > 0) {
      rds.forEach(i => {
        h2 += `<tr><td>${i.rewards?.title || i.reward_id}<br><small>${i.profiles?.email || '學生ID: ' + i.user_id.slice(0,8)}</small></td>
               <td><button onclick="approveR('${i.id}')">發獎</button> <button onclick="rejectR('${i.id}')">退回</button></td></tr>`;
      });
    } else { h2 += "<tr><td colspan='2' style='text-align:center;'>目前無待領取獎勵</td></tr>"; }
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