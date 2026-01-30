// 👤 Personal Profile Management Functions
let currentProfile = null;
// 📊 全域累計點數（給獎勵門檻判斷用，預設為 0）
let currentTotalPoints = 0;
// 上一次等級（用於升級慶祝，僅在真正升級時觸發）
let lastRankLabel = null;

async function loadProfileData(userId) {
  try {
    const { data: profile } = await sb.from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    
    if (profile) {
      currentProfile = profile;
    } else {
      // 尚無 profiles 列或讀取失敗：至少顯示登入帳號名稱（避免整頁空白）
      let fallbackName = "User";
      try {
        const { data: { session } } = await sb.auth.getSession();
        if (session?.user) {
          const u = session.user;
          fallbackName = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "User";
        }
      } catch (_) {}
      currentProfile = { id: userId, full_name: fallbackName };
    }
    
    updateProfileCard();
    populateProfileForm();
    
    console.log("✅ Profile data loaded:", currentProfile);
    
  } catch (e) {
    console.error("❌ Failed to load profile:", e);
    // 失敗時仍用登入資訊顯示名稱，避免整頁空白
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) {
        const u = session.user;
        const fallbackName = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "User";
        currentProfile = { id: userId, full_name: fallbackName };
        updateProfileCard();
      }
    } catch (_) {}
  }
}

function updateProfileCard() {
  if (!currentProfile) return;

  // 更新詳細資訊頁面的卡片
  if ($("profileCardName")) {
    $("profileCardName").innerText = currentProfile.full_name || 'Not Filled';
  }
  if ($("profileCardNationality")) {
    $("profileCardNationality").innerText = currentProfile.nationality || '-';
  }
  if ($("profileCardEnrolledYear")) {
    $("profileCardEnrolledYear").innerText = currentProfile.enrolled_year || '-';
  }
  if ($("profileCardDegree")) {
    $("profileCardDegree").innerText = currentProfile.degree || '-';
  }
  if ($("profileCardCollege")) {
    $("profileCardCollege").innerText = currentProfile.college || '-';
  }
  if ($("profileCardProgram")) {
    $("profileCardProgram").innerText = currentProfile.program || '-';
  }
  if ($("profileCardStudentId")) {
    $("profileCardStudentId").innerText = currentProfile.student_id || '-';
  }
  if ($("profileCardPhone")) {
    $("profileCardPhone").innerText = currentProfile.phone || '-';
  }

  // 更新護照卡片上的資料
  if ($("p_name")) {
    const chineseName = currentProfile.chinese_name || '';
    const fullName = currentProfile.full_name || 'Not Filled';
    $("p_name").innerHTML = chineseName ? `${fullName}<br>${chineseName}` : fullName;
  }
  if ($("p_nation")) {
    $("p_nation").innerText = currentProfile.nationality || '-';
  }
  if ($("p_year")) {
    $("p_year").innerText = currentProfile.enrolled_year || '-';
  }
  if ($("p_degree")) {
    $("p_degree").innerText = currentProfile.degree || '-';
  }
  if ($("p_college")) {
    $("p_college").innerText = currentProfile.college || '-';
  }
  if ($("p_program")) {
    $("p_program").innerText = currentProfile.program || '-';
  }
  if ($("p_studentId")) {
    $("p_studentId").innerText = currentProfile.student_id || '-';
  }
  if ($("p_phone")) {
    $("p_phone").innerText = currentProfile.phone || '-';
  }

  // 更新照片
  if ($("profileCardPhoto")) {
    if (currentProfile.photo_url) {
      $("profileCardPhoto").innerHTML = `<img src="${currentProfile.photo_url}" style="width:100%; height:100%; object-fit:cover;">`;
    } else {
      $("profileCardPhoto").innerHTML = '<span class="photo-placeholder">PHOTO</span>';
    }
  }
  
  if ($("profileCardPhotoDetail")) {
    if (currentProfile.photo_url) {
      $("profileCardPhotoDetail").innerHTML = `<img src="${currentProfile.photo_url}" style="width:100%; height:100%; object-fit:cover;">`;
    } else {
      $("profileCardPhotoDetail").innerHTML = '📷';
    }
  }
  
  if ($("profilePhotoPreview")) {
    if (currentProfile.photo_url) {
      $("profilePhotoPreview").innerHTML = `<img src="${currentProfile.photo_url}" style="width:100%; height:100%; object-fit:cover;">`;
    } else {
      $("profilePhotoPreview").innerHTML = '📷';
    }
  }

  // 更新個人簡介
  if ($("bioContent")) {
    if (currentProfile.bio) {
      $("bioContent").innerHTML = currentProfile.bio.replace(/\n/g, '<br>');
    } else {
      $("bioContent").innerHTML = 'No bio yet.';
    }
  }

  // 更新印章日期
  if ($("stampDate")) {
    const enrolledYear = currentProfile.enrolled_year || new Date().getFullYear();
    $("stampDate").innerText = `${enrolledYear}.09.01`;
  }
}

function populateProfileForm() {
  if (!currentProfile) return;

  $("profileName").value = currentProfile.full_name || '';
  $("profileNationality").value = currentProfile.nationality || '';
  $("profileEnrolledYear").value = currentProfile.enrolled_year || '';
  $("profileDegree").value = currentProfile.degree || '';
  $("profileCollege").value = currentProfile.college || '';
  $("profileProgram").value = currentProfile.program || '';
  $("profileStudentId").value = currentProfile.student_id || '';
  $("profilePhone").value = currentProfile.phone || '';
  $("profileAddress").value = currentProfile.address || '';
  $("profileBio").value = currentProfile.bio || '';
}

function initProfileUI() {
  if ($("btnEditProfileFromCard")) {
    $("btnEditProfileFromCard").onclick = () => {
      if (typeof showSection === 'function') {
        showSection('edit');
        setTimeout(() => {
          const editSection = document.getElementById('section-edit');
          if (editSection) {
            window.scrollTo({ top: editSection.offsetTop - 50, behavior: 'smooth' });
          }
        }, 100);
      } else {
        // 後備方案：如果 showSection 不存在
        const editSection = document.getElementById('section-edit');
        if (editSection) {
          editSection.classList.add('active');
          window.scrollTo({ top: editSection.offsetTop - 50, behavior: 'smooth' });
        }
      }
    };
  }

  if ($("btnViewProfileBio")) {
    $("btnViewProfileBio").onclick = () => {
      if (typeof showSection === 'function') {
        showSection('bio');
        setTimeout(() => {
          const bioSection = document.getElementById('section-bio');
          if (bioSection) {
            window.scrollTo({ top: bioSection.offsetTop - 50, behavior: 'smooth' });
          }
        }, 100);
      } else {
        if (currentProfile && currentProfile.bio) {
          alert(`📝 Bio of ${currentProfile.full_name}:\n\n${currentProfile.bio}`);
        } else {
          alert("Bio not yet filled");
        }
      }
    };
  }

  if ($("btnSaveProfile")) {
    $("btnSaveProfile").onclick = saveProfile;
  }

  if ($("btnCancelProfile")) {
    $("btnCancelProfile").onclick = () => {
      if (typeof showSection === 'function') {
        showSection('info');
      } else {
        const profileFormContainer = $("profileFormContainer");
        if (profileFormContainer) {
          profileFormContainer.style.display = "none";
        }
      }
      if ($("profileMessage")) {
        $("profileMessage").innerHTML = "";
      }
    };
  }

  if ($("profilePhoto")) {
    $("profilePhoto").onchange = handlePhotoUpload;
  }
}

async function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    $("profilePhotoPreview").innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
  };
  reader.readAsDataURL(file);

  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      alert("❌ Please sign in first");
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    
    console.log("Uploading photo:", { filePath, fileSize: file.size });
    
    const { data, error } = await sb.storage
      .from("profile_photos")
      .upload(filePath, file, { 
        upsert: true,
        contentType: file.type
      });

    if (error) {
      console.error("❌ Photo upload failed:", error);
      alert(`❌ Photo upload failed: ${error.message}`);
      return;
    }

    const { data: urlData } = sb.storage
      .from("profile_photos")
      .getPublicUrl(filePath);
    
    currentProfile.photo_url = urlData.publicUrl;
    updateProfileCard();
    
    console.log("✅ Photo uploaded:", urlData.publicUrl);
    
  } catch (e) {
    console.error("System error:", e);
    alert(`❌ System error: ${e.message}`);
  }
}

async function saveProfile() {
  const btn = $("btnSaveProfile");
  const msgDiv = $("profileMessage");
  btn.disabled = true;
  btn.innerText = "Saving...";
  msgDiv.innerHTML = "⏳ Saving...";

  try {
    const { data: { user } } = await sb.auth.getUser();
    
    const fullName = $("profileName").value.trim();
    if (!fullName) {
      msgDiv.innerHTML = "<span style='color: red;'>❌ Full Name is required</span>";
      return;
    }

    const profileData = {
      id: user.id,
      full_name: fullName,
      nationality: $("profileNationality").value.trim(),
      enrolled_year: parseInt($("profileEnrolledYear").value) || null,
      degree: $("profileDegree").value,
      college: $("profileCollege").value.trim(),
      program: $("profileProgram").value.trim(),
      student_id: $("profileStudentId").value.trim(),
      phone: $("profilePhone").value.trim(),
      address: $("profileAddress").value.trim(),
      bio: $("profileBio").value.trim(),
      photo_url: currentProfile.photo_url || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await sb.from("profiles").upsert(profileData);

    if (error) {
      msgDiv.innerHTML = `<span style='color: red;'>❌ Save failed: ${error.message}</span>`;
      return;
    }

    currentProfile = profileData;
    updateProfileCard();
    
    msgDiv.innerHTML = "<span style='color: green;'>✅ Profile saved successfully!</span>";
    
    setTimeout(() => {
      if (typeof showSection === 'function') {
        showSection('info');
      } else {
        const profileFormContainer = $("profileFormContainer");
        if (profileFormContainer) {
          profileFormContainer.style.display = "none";
        }
      }
      msgDiv.innerHTML = "";
    }, 3000);

  } catch (e) {
    console.error("System error:", e);
    msgDiv.innerHTML = "<span style='color: red;'>❌ System error, please retry</span>";
  } finally {
    btn.disabled = false;
    btn.innerText = "💾 Save Profile";
  }
}

// 🎁 Reward Management Module
let allRewards = [];

async function initRewardList() {
  try {
    const { data, error } = await sb.from("rewards")
      .select("*")
      .order('cost_points', { ascending: true });

    if (error) {
      console.error("❌ Failed to load rewards:", error);
      $("selectRewardId").innerHTML = "<option value=''>Failed to load rewards</option>";
      return;
    }

    if (!data || data.length === 0) {
      console.warn("⚠️ No rewards found in table");
      $("selectRewardId").innerHTML = "<option value=''>No rewards defined yet</option>";
      return;
    }

    allRewards = data;
    renderRewards(allRewards);
  } catch (e) {
    console.error("❌ Failed to load rewards (exception):", e);
    $("selectRewardId").innerHTML = "<option value=''>Failed to load rewards</option>";
  }
}

function renderRewards(list) {
  $("selectRewardId").innerHTML = list.map(r => {
    const status = currentTotalPoints >= r.cost_points 
      ? "✅ Eligible" 
      : `🔒 Need ${r.cost_points - currentTotalPoints} more pt`;
    return `<option value="${r.id}">${r.title} (Threshold: ${r.cost_points} pt) - ${status}</option>`;
  }).join('');
}

$("searchReward").oninput = (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allRewards.filter(r => r.title.toLowerCase().includes(term));
  renderRewards(filtered);

  if (filtered.length === 0) {
    $("selectRewardId").innerHTML = "<option value=''>No matching rewards found</option>";
  }
};

// 🔧 全域 cancelApply 函數
window.cancelApply = async (id, table) => {
  console.log(`Attempting to revoke: ${id} from ${table}`);
  
  // 🔧 改用 window.confirm
  if (!window.confirm("Confirm revoke this request?")) {
    console.log("User cancelled revoke");
    return;
  }
  
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      alert("❌ Not authenticated");
      return;
    }

    console.log(`Deleting ${id} from ${table}`);
    
    const { error } = await sb.from(table)
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Delete error:", error);
      alert(`❌ Failed to revoke: ${error.message}`);
      return;
    }
    
    console.log("✅ Successfully deleted");
    alert("✅ Request revoked successfully");
    
    await loadPointEvents();
    
  } catch (e) {
    console.error("Revoke error:", e);
    alert(`❌ System error: ${e.message}`);
  }
};

async function loadPointEvents() {
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    // 不做資料表關聯查詢，避免 Supabase 關聯設定不完整時拋錯
    const { data: pts, error: ptsError } = await sb.from("point_events")
      .select("*")
      .eq("user_id", user.id)
      .order('created_at', { ascending: false });

    const { data: rds, error: rdsError } = await sb.from("redemptions")
      .select("*")
      .eq("user_id", user.id)
      .order('created_at', { ascending: false });

    if (ptsError || rdsError) {
      console.error("Failed to load records from Supabase:", { ptsError, rdsError });
      $("outEvents").innerHTML = "<p style='color:red;'>Failed to load records (permission or network issue). Please contact admin.</p>";
      return;
    }

    if (pts) {
      currentTotalPoints = pts
        .filter(i => i.status === 'approved')
        .reduce((s, i) => s + (i.points || 0), 0);
      
      // 更新護照卡片上的點數顯示
      if ($("totalPoints")) {
        $("totalPoints").innerText = currentTotalPoints + " PT";
      }
      
      // 更新等級標籤，並在升級時顯示慶祝 Toast
      if ($("rankTag")) {
        let rank = "Bronze Member";
        if (currentTotalPoints >= 1000) rank = "Platinum Member";
        else if (currentTotalPoints >= 500) rank = "Gold Member";
        else if (currentTotalPoints >= 200) rank = "Silver Member";
        $("rankTag").innerText = rank;
        const rankOrder = { "Bronze Member": 0, "Silver Member": 1, "Gold Member": 2, "Platinum Member": 3 };
        if (lastRankLabel !== null && (rankOrder[rank] || 0) > (rankOrder[lastRankLabel] || 0) && typeof showLevelUpToast === "function") {
          showLevelUpToast(rank);
        }
        lastRankLabel = rank;
      }
      
      // 更新詳細點數顯示（記錄頁面）
      if ($("totalPointsDisplay")) {
        $("totalPointsDisplay").innerHTML = 
          `<div><div>${currentTotalPoints} pt</div><small>Points Accumulated</small></div>`;
      }
      
      // 更新集章頁面的最近記錄（最新一筆加 log-item-newest 進場動畫）
      if ($("logList")) {
        const recentLogs = pts.slice(0, 5);
        if (recentLogs.length > 0) {
          $("logList").innerHTML = recentLogs.map((l, idx) => {
            const statusClass = l.status === 'approved' ? 'text-green-600' : 
                               l.status === 'rejected' ? 'text-red-600' : 'text-orange-500';
            const statusText = l.status === 'approved' ? '✅' : 
                              l.status === 'rejected' ? '❌' : '⏳';
            const newestClass = idx === 0 ? ' log-item-newest' : '';
            return `<div class="log-item flex justify-between border-b pb-1${newestClass}">
              <span>${l.missions?.title || l.task_code || 'Unknown mission'}</span>
              <span class="font-bold ${statusClass}">${statusText} ${l.points || 0}pt</span>
            </div>`;
          }).join('');
        } else {
          $("logList").innerHTML = '<div class="text-gray-400">No records yet</div>';
        }
      }
      
      let h1 = "<h4>📌 Task Point Records</h4><table><tr><th>Time</th><th>Task</th><th>Status</th></tr>";
      pts.forEach(i => {
        const time = formatTime(i.created_at);
        let statusHtml = i.status === 'pending' 
          ? `⏳ Under Review <button class="btn-revoke" onclick="window.cancelApply('${i.id}', 'point_events')">Revoke</button>` 
          : (i.status === 'approved' 
            ? "✅ Approved" 
            : `<span class="status-rejected" title="${i.admin_comment || 'N/A'}">❌ Rejected</span>`);
        h1 += `<tr><td>${time}</td><td>${i.missions?.title || i.task_code}</td><td>${statusHtml}</td></tr>`;
      });
      h1 += "</table>";

      let h2 = "<h4 style='margin-top:20px;'>🎁 Reward Claim Records</h4><table><tr><th>Time</th><th>Reward</th><th>Status</th></tr>";
      if (rds && rds.length > 0) {
        rds.forEach(i => {
          const time = formatTime(i.created_at);
          let rStatusHtml = i.status === 'pending' 
            ? `⏳ Under Review <button class="btn-revoke" onclick="window.cancelApply('${i.id}', 'redemptions')">Revoke</button>` 
            : (i.status === 'approved' 
              ? "<span class='status-approved'>✅ Distributed</span>" 
              : `<span class="status-rejected" title="${i.admin_comment || 'N/A'}">❌ Rejected</span>`);
          
          h2 += `<tr><td>${time}</td><td>${i.rewards?.title || i.reward_id}</td><td>${rStatusHtml}</td></tr>`;
        });
      } else { 
        h2 += "<tr><td colspan='3' style='text-align:center; color:gray;'>No claims yet</td></tr>"; 
      }
      h2 += "</table>";
      
      if ($("outEvents")) {
        $("outEvents").innerHTML = h1 + h2;
      }
    }
  } catch (e) { 
    console.error("Failed to load records:", e); 
    $("outEvents").innerHTML = "<p style='color:red;'>Failed to load records, please refresh the page.</p>";
  }
}

// Claim Task Points
$("btnApplyPoints").onclick = async () => {
  const mid = $("selectMissionId").value;
  if (!mid) {
    if (typeof showAlert === "function") showAlert("⚠️ Please select a task");
    return;
  }
  const btn = $("btnApplyPoints");
  const originalText = btn.innerText;
  btn.disabled = true;
  btn.innerText = "Claiming…";
  const minLoadingMs = 500;
  const loadingStart = Date.now();

  try {
    const { data: { user } } = await sb.auth.getUser();
    const { data: existing } = await sb.from("point_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("mission_id", mid)
      .in("status", ["pending", "approved"])
      .maybeSingle();

    if (existing) {
      btn.disabled = false;
      btn.innerText = originalText;
      if (typeof showAlert === "function") showAlert("⚠️ You have already claimed this task!");
      return;
    }

    const selectedMission = typeof allMissions !== "undefined" ? allMissions.find(m => m.id === mid) : null;
    const { error } = await sb.from("point_events").insert([
      {
        user_id: user.id,
        mission_id: mid,
        points: selectedMission?.points || 0,
        status: "pending",
        task_code: selectedMission?.code || mid
      }
    ]);

    if (error) {
      btn.disabled = false;
      btn.innerText = originalText;
      if (typeof showAlert === "function") showAlert(`❌ Claim failed: ${error.message}`);
      return;
    }

    $("outMissionStatus").innerHTML = `<b>Latest:</b> ${selectedMission ? selectedMission.title : mid} <span class="status-processing">⏳ Processing</span>`;
    if (typeof showStampToast === "function") showStampToast(selectedMission ? selectedMission.title : mid, selectedMission ? selectedMission.points : null);
    await loadPointEvents();
    await refreshAll();
  } catch (e) {
    console.error("Error:", e);
    if (typeof showAlert === "function") showAlert(`❌ System error: ${e.message}`);
  } finally {
    const elapsed = Date.now() - loadingStart;
    const wait = Math.max(0, minLoadingMs - elapsed);
    setTimeout(() => {
      btn.disabled = false;
      btn.innerText = originalText;
    }, wait);
  }
};

// Claim Reward
$("btnRedeem").onclick = async () => {
  const rid = $("selectRewardId").value;
  
  if (!rid) {
    alert("⚠️ Please select a reward");
    return;
  }
  
  const { data: { user } } = await sb.auth.getUser();
  
  try {
    const { data: existing } = await sb.from("redemptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("reward_id", rid)
      .in("status", ["pending", "approved"])
      .maybeSingle();
    
    if (existing) {
      alert("⚠️ You have already claimed this reward!");
      return;
    }
    
    const selectedReward = allRewards.find(r => r.id === rid);
    if (!selectedReward) {
      alert("⚠️ Reward not found!");
      return;
    }
    
    if (currentTotalPoints < selectedReward.cost_points) {
      alert(`⚠️ Not enough points! You need ${selectedReward.cost_points - currentTotalPoints} more points`);
      return;
    }
    
    const { error } = await sb.from("redemptions").insert([
      { user_id: user.id, reward_id: rid, status: 'pending' }
    ]);
    
    if (error) {
      if (typeof showAlert === "function") showAlert(`❌ Claim failed: ${error.message}`);
      return;
    }

    $("outRedeem").innerHTML = `<b>Latest:</b> ${selectedReward.title} <span class="status-processing">⏳ Processing</span>`;
    if (typeof showRewardToast === "function") showRewardToast(selectedReward.title);
    await loadPointEvents();
    await refreshAll();
    
  } catch (e) {
    console.error("Error:", e);
    alert(`❌ System error: ${e.message}`);
  }
};