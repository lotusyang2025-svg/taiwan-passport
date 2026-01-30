// 🚀 App Main Entry Point

async function initApp() {
  console.log("🚀 Initializing Taiwan Passport App...");
  
  try {
    // 檢查瀏覽器
    checkBrowser();
    
    // 初始化版號
    initVersionDisplay();
    
    // 檢查登入狀態
    const { data: { session } } = await sb.auth.getSession();
    
    if (session) {
      console.log("✅ User logged in:", session.user.email);
      await refreshAll();
    } else {
      console.log("⚠️ No active session");
      await refreshAll();
    }
    
  } catch (e) {
    // 對 Supabase / 網路相關錯誤做友善提示
    if (e?.name === "AbortError") {
      console.error("❌ App initialization error: network request aborted (可能是瀏覽器擴充功能或網路環境阻擋 Supabase)", e);
      const userInfoEl = document.getElementById("userInfo");
      const authBtn = document.getElementById("btnAuth");
      if (userInfoEl) {
        userInfoEl.innerHTML = "<span style='color:#f97316;'>⚠️ 無法連線到認證服務，請檢查瀏覽器外掛或網路環境。</span><br><small style='color:#64748b;'>可先試「重試連線」，或改用預設瀏覽器、關閉廣告阻擋後再試。</small>";
      }
      if (authBtn) {
        authBtn.innerText = "重試連線";
        authBtn.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
        authBtn.onclick = function retryConnect() {
          authBtn.innerText = "連線中…";
          authBtn.onclick = null;
          initApp();
        };
      }
    } else {
      console.error("❌ App initialization error:", e);
      const userInfoEl = document.getElementById("userInfo");
      const authBtn = document.getElementById("btnAuth");
      if (userInfoEl) {
        userInfoEl.innerHTML = "<span style='color:#ef4444;'>⚠️ 初始化失敗，請重新整理頁面。</span>";
      }
      if (authBtn) {
        authBtn.innerText = "重試連線";
        authBtn.onclick = function () { location.reload(); };
      }
    }
  }
}

// 監聽認證狀態變化
sb.auth.onAuthStateChange(async (event, session) => {
  console.log("🔐 Auth state changed:", event);
  if (session) {
    await refreshAll();
  }
});

// 頁面載入完成時初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}