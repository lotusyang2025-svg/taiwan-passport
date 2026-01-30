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

// 重新整理後 Supabase 可能尚未從 localStorage 還原 session；第一次給較長逾時，減少多次 timeout 的等待感
const GET_SESSION_FIRST_TIMEOUT_MS = 10000;  // 第一次等 10 秒
const GET_SESSION_NEXT_TIMEOUT_MS = 4000;     // 後續每次 4 秒
async function getSessionWithRetry(maxAttempts = 4, delayMs = 400) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const timeoutMs = attempt === 1 ? GET_SESSION_FIRST_TIMEOUT_MS : GET_SESSION_NEXT_TIMEOUT_MS;
    try {
      const result = await Promise.race([
        sb.auth.getSession(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("getSession timeout")), timeoutMs)
        ),
      ]);
      const session = result?.data?.session;
      if (session?.user) {
        return session.user;
      }
    } catch (e) {
      if (e?.message === "getSession timeout") {
        console.warn("getSession() timeout (attempt " + attempt + "/" + maxAttempts + ")");
      } else {
        console.warn("getSession() failed (attempt " + attempt + "):", e);
      }
    }
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return null;
}

let refreshAllInProgress = false;
let refreshAllPending = false;

async function refreshAll() {
  if (refreshAllInProgress) {
    refreshAllPending = true;
    return;
  }
  refreshAllInProgress = true;
  console.log("🔄 Refreshing all data...");
  
  try {
    // 先讀本地 session；重新整理後可能需等 Supabase 從 localStorage 還原，故重試較久
    let user = await getSessionWithRetry();
    if (user) {
      console.log("✅ Using session from getSession()");
    }
    
    // 4 次都 timeout 的原因：Supabase 在還原 session 前 getSession() 會一直不 resolve。再等 2 秒做「最後一次」嘗試，有機會直接進去不閃登入頁
    if (!user) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const result = await Promise.race([
          sb.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 6000)),
        ]);
        if (result?.data?.session?.user) {
          user = result.data.session.user;
          console.log("✅ Using session from getSession() (last chance)");
        }
      } catch (_) {}
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
  $("userInfo").innerHTML = `${greeting},<br><b>${quickName}</b><br><small>${user.email}</small><br><small style="color: #94a3b8;">Loading…</small>`;
  $("userPanel").style.display = "block";
  $("adminPanel").style.display = "none";

  try {
    const { data: profile } = await sb.from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    const userName = profile?.full_name || quickName;

    const { data: isAdmin } = await sb.rpc("is_admin");
    const { data: isSuperAdmin } = await sb.rpc("is_super_admin");
    window.isSuperAdmin = !!isSuperAdmin;
    const roleText = isSuperAdmin ? "Super Admin" : (isAdmin ? "Admin" : "Student");
    $("userInfo").innerHTML = `${greeting},<br><b>${userName}</b><br><small>${user.email}</small><br><small style="color: #60a5fa; font-weight: 600;">Role: ${roleText}</small>`;

    if (isAdmin) {
      console.log("👨‍💼 Loading admin panel...");
      $("adminPanel").style.display = "block";
      $("userPanel").style.display = "none";
      const adminManageSection = document.getElementById("adminManageSection");
      if (adminManageSection) adminManageSection.style.display = window.isSuperAdmin ? "block" : "none";
      loadAdminData();
    } else {
      window.isSuperAdmin = false;
      console.log("🎓 Loading student panel...");
      $("adminPanel").style.display = "none";
      $("userPanel").style.display = "block";
      await loadProfileData(user.id);
      initProfileUI();
      await loadPointEvents();
      await initMissionList();
      await initRewardList();
      loadLeaderboard();
      console.log("📱 Processing QR code parameters...");
      await handleUrlParams(user.id);
      console.log("✅ All initialization complete");
    }
  } catch (e) {
    console.error("❌ Refresh data error:", e);
    $("userInfo").innerHTML = `${greeting},<br><b>${quickName}</b><br><small>${user.email}</small><br><small style="color: #f97316;">Partial load failed. Please refresh or try again.</small>`;
  }
  } finally {
    refreshAllInProgress = false;
    if (refreshAllPending) {
      refreshAllPending = false;
      refreshAll();
    }
  }
}