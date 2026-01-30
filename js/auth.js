// 🔐 Authentication & Authorization

// 小工具：帶逾時與重試的 getUser（僅在無本地 session 時使用）
async function getUserWithRetry(maxAttempts = 5, timeoutMs = 12000, delayMs = 2000) {
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
  
  // 先讀本地 session（快、不發網路請求），避免 getUser 逾時導致「已登入卻被當成未登入」
  let user = null;
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) {
      user = session.user;
      console.log("✅ Using session from getSession()");
    }
  } catch (e) {
    console.warn("getSession() failed:", e);
  }
  
  // 沒有本地 session 時才呼叫 getUser（例如剛從 OAuth 回來、或跨裝置）
  if (!user) {
    user = await getUserWithRetry();
  }
  
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
  
  // 先更新按鈕與基本資訊，避免後續請求卡住時一直顯示 Loading
  authBtn.innerText = "Sign Out";
  authBtn.style.background = "#64748b";
  authBtn.onclick = async () => { 
    await sb.auth.signOut(); 
    location.reload(); 
  };
  const hours = new Date().getHours();
  const greeting = hours < 12 ? "Good Morning" : hours < 18 ? "Good Afternoon" : "Good Evening";
  const quickName = user.email?.split('@')[0] || user.user_metadata?.full_name || 'User';
  $("userInfo").innerHTML = `${greeting},<br><b>${quickName}</b><br><small>${user.email}</small><br><small style="color: #94a3b8;">載入中…</small>`;
  $("userPanel").style.display = "block";
  $("adminPanel").style.display = "none";

  try {
    const { data: profile } = await sb.from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    const userName = profile?.full_name || quickName;

    const { data: isAdmin } = await sb.rpc("is_admin");
    const roleText = isAdmin ? "Admin" : "Student";
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
      await loadProfileData(user.id);
      initProfileUI();
      await loadPointEvents();
      await initMissionList();
      await initRewardList();
      console.log("📱 Processing QR code parameters...");
      await handleUrlParams(user.id);
      console.log("✅ All initialization complete");
    }
  } catch (e) {
    console.error("❌ Refresh data error:", e);
    $("userInfo").innerHTML = `${greeting},<br><b>${quickName}</b><br><small>${user.email}</small><br><small style="color: #f97316;">載入部分資料失敗，請重新整理或稍後再試。</small>`;
  }
}