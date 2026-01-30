// 🎯 Task Management Module
let allMissions = [];

async function initMissionList() {
  try {
    const { data, error } = await sb.from("missions")
      .select("*")
      .order('points', { ascending: true });

    if (error) {
      console.error("❌ Failed to load missions:", error);
      $("selectMissionId").innerHTML = "<option value=''>Failed to load tasks</option>";
      return;
    }

    if (!data || data.length === 0) {
      console.warn("⚠️ No missions found in table");
      $("selectMissionId").innerHTML = "<option value=''>No tasks defined yet</option>";
      return;
    }

    allMissions = data;
    renderMissions(allMissions);
  } catch (e) {
    console.error("❌ Failed to load missions (exception):", e);
    $("selectMissionId").innerHTML = "<option value=''>Failed to load tasks</option>";
  }
}

function renderMissions(list) {
  $("selectMissionId").innerHTML = list.map(m => {
    return `<option value="${m.id}">${m.title} (+${m.points} pt)</option>`;
  }).join('');
}

$("searchMission").oninput = (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allMissions.filter(m => m.title.toLowerCase().includes(term));
  renderMissions(filtered);

  if (filtered.length === 0) {
    $("selectMissionId").innerHTML = "<option value=''>No matching tasks found</option>";
  }
};

async function handleUrlParams(userId) {
  try {
    console.log("🔍 Checking URL parameters...");
    
    const params = new URLSearchParams(window.location.search);
    const missionCode = params.get('mission') || params.get('m') || params.get('code') || params.get('task');
    
    if (!missionCode) {
      console.log("✓ No mission parameter found in URL");
      return;
    }
    
    console.log(`📱 Found QR scan parameter: ${missionCode}`);
    
    // 清除 URL 參數
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // 確保任務列表已載入
    if (!allMissions || allMissions.length === 0) {
      console.log("⏳ Waiting for missions to load...");
      await initMissionList();
    }
    
    // 查找對應的任務
    const mission = allMissions.find(m => 
      m.id === missionCode || m.code === missionCode || m.task_code === missionCode
    );
    
    if (!mission) {
      console.error(`❌ Mission not found: ${missionCode}`);
      console.log("Available missions:", allMissions.map(m => ({ id: m.id, code: m.code, title: m.title })));
      $("outMissionStatus").innerHTML = `<span style="color: red;">❌ Mission not found: ${missionCode}</span>`;
      return;
    }
    
    console.log(`✅ Found mission: ${mission.title}`);
    
    // 檢查是否已經申請過
    const { data: existing, error: checkError } = await sb.from("point_events")
      .select("id, status")
      .eq("user_id", userId)
      .eq("mission_id", mission.id)
      .in("status", ["pending", "approved"])
      .maybeSingle();
    
    if (checkError) {
      console.error("Check error:", checkError);
    }
    
    if (existing) {
      console.log(`⚠️ Already claimed: ${mission.title}`);
      $("outMissionStatus").innerHTML = `<span style="color: orange;">⚠️ Already claimed: ${mission.title}</span>`;
      return;
    }
    
    // 自動申請集點
    console.log(`📝 Claiming points for: ${mission.title}`);
    
    const { data, error } = await sb.from("point_events").insert([
      {
        user_id: userId,
        mission_id: mission.id,
        points: mission.points || 0,
        status: 'pending',
        task_code: mission.code || mission.id
      }
    ]);
    
    if (error) {
      console.error("❌ Failed to claim points:", error);
      $("outMissionStatus").innerHTML = `<span style="color: red;">❌ Failed to claim: ${error.message}</span>`;
      return;
    }
    
    console.log(`✅ Successfully claimed: ${mission.title} (+${mission.points} pt)`);
    $("outMissionStatus").innerHTML = `<b style="color: #10b981;">✅ Auto-claimed:</b> ${mission.title} <span class="status-processing">(+${mission.points} pt)</span>`;
    if (typeof showStampToast === "function") showStampToast(mission.title, mission.points);
    await loadPointEvents();
    
  } catch (e) {
    console.error("❌ Error handling URL params:", e);
    $("outMissionStatus").innerHTML = `<span style="color: red;">❌ Error: ${e.message}</span>`;
  }
}

$("btnApplyPoints").onclick = async () => {
  const mid = $("selectMissionId").value;
  if (!mid) return;
  const btn = $("btnApplyPoints");
  const originalText = btn.innerText;
  btn.disabled = true;
  btn.innerText = "Claiming…";

  try {
    const { data: { user } } = await sb.auth.getUser();
    const { data: existing } = await sb.from("point_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("mission_id", mid)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      if (typeof showAlert === "function") showAlert("⚠️ Already claimed this task!");
      return;
    }

    await sb.from("point_events").insert([
      { user_id: user.id, mission_id: mid, points: 0, status: "pending" }
    ]);

    const selectedMission = allMissions.find(m => m.id === mid);
    $("outMissionStatus").innerHTML = `<b>Latest:</b> ${selectedMission ? selectedMission.title : mid} <span class="status-processing">⏳ Processing</span>`;
    if (typeof showStampToast === "function") showStampToast(selectedMission ? selectedMission.title : mid, selectedMission ? selectedMission.points : null);
    refreshAll();
  } catch (e) {
    console.error("Claim error:", e);
    if (typeof showAlert === "function") showAlert("Failed to submit. Please try again.");
  } finally {
    btn.disabled = false;
    btn.innerText = originalText;
  }
};