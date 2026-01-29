// 🔐 Authentication & Authorization

// 小工具：帶逾時與重試的 getUser
async function getUserWithRetry(maxAttempts = 3, timeoutMs = 5000, delayMs = 1500) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await Promise.race([
        sb.auth.getUser(),
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ data: { user: null }, error: { name: "Timeout", message: "auth.getUser timeout" } }),
            timeoutMs
          )
        ),
      ]);

      if (result?.error && result.error.name === "Timeout") {
        console.warn(`⚠️ sb.auth.getUser timed out (attempt ${attempt}/${maxAttempts})`);
      }

      const user = result?.data?.user || null;
      if (user) {
        return user;
      }
    } catch (e) {
      console.error(`❌ sb.auth.getUser failed (attempt ${attempt}/${maxAttempts}):`, e);
    }

    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  console.warn("⚠️ sb.auth.getUser failed after all retries, treat as no-user state");
  return null;
}

async function refreshAll() {
  console.log("🔄 Refreshing all data...");
  
  // 使用「逾時 + 自動重試」版本的 getUser，避免永遠卡在 pending
  const user = await getUserWithRetry();
  const authBtn = $("btnAuth");

  if (!user) {
    console.log("👤 No user, showing login");
    authBtn.innerText = "Sign In with Google";
    authBtn.style.background = "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
    authBtn.onclick = () => sb.auth.signInWithOAuth({ 
      provider: "google", 
      options: { redirectTo: window.location.href.split('#')[0] } 
    });
    $("userInfo").innerText = "Please sign in to continue";
    $("userPanel").style.display = "none";
    $("adminPanel").style.display = "none";
    return;
  }

  console.log("✅ User logged in:", user.email);
  
  authBtn.innerText = "Sign Out";
  authBtn.style.background = "#64748b";
  authBtn.onclick = async () => { 
    await sb.auth.signOut(); 
    location.reload(); 
  };

  const { data: profile } = await sb.from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  
  const userName = profile?.full_name || user.email?.split('@')[0] || 'User';

  const { data: isAdmin } = await sb.rpc("is_admin");
  const roleText = isAdmin ? "Admin" : "Student";
  const hours = new Date().getHours();
  const greeting = hours < 12 ? "Good Morning" : hours < 18 ? "Good Afternoon" : "Good Evening";
  
  $("userInfo").innerHTML = `${greeting},<br><b>${userName}</b><br><small>${user.email}</small><br><small style="color: #60a5fa; font-weight: 600;">Role: ${roleText}</small>`;

  if (isAdmin) {
    console.log("👨‍💼 Loading admin panel...");
    $("adminPanel").style.display = "block";
    $("userPanel").style.display = "none";
    loadAdminData();
  } else {
    console.log("🎓 Loading student panel...");
    $("adminPanel").style.display = "none";
    $("userPanel").style.display = "block";
    
    // 按順序載入
    await loadProfileData(user.id);
    initProfileUI();
    await loadPointEvents();
    await initMissionList();
    await initRewardList();
    
    // 🔧 重點：在最後處理 URL 參數（掃碼）
    console.log("📱 Processing QR code parameters...");
    await handleUrlParams(user.id);
    
    console.log("✅ All initialization complete");
  }
}