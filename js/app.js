// 🚀 App Main Entry Point

let authStateReceived = false;

async function initApp() {
  console.log("🚀 Initializing Taiwan Passport App...");
  
  try {
    checkBrowser();
    initVersionDisplay();
    
    // 不主動呼叫 refreshAll()，改由 onAuthStateChange(INITIAL_SESSION) 觸發，getSession() 較易第一次就成功
    // 若 12 秒內未收到 auth 事件則 fallback 呼叫一次，避免永遠卡在 Loading
    setTimeout(() => {
      if (!authStateReceived) {
        console.warn("⚠️ onAuthStateChange 未觸發，改由 fallback 呼叫 refreshAll()");
        refreshAll();
      }
    }, 12000);
    
  } catch (e) {
    // 對 Supabase / 網路相關錯誤做友善提示
    if (e?.name === "AbortError") {
      console.error("❌ App initialization error: network request aborted (可能是瀏覽器擴充功能或網路環境阻擋 Supabase)", e);
      const userInfoEl = document.getElementById("userInfo");
      const authBtn = document.getElementById("btnAuth");
      if (userInfoEl) {
        userInfoEl.innerHTML = "<span style='color:#f97316;'>⚠️ Cannot connect to auth service. Check browser extensions or network.</span><br><small style='color:#64748b;'>Try \"Retry\" or use default browser and disable ad blockers.</small>";
      }
      if (authBtn) {
        authBtn.innerText = "Retry";
        authBtn.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
        authBtn.onclick = function retryConnect() {
          authBtn.innerText = "Connecting…";
          authBtn.onclick = null;
          initApp();
        };
      }
    } else {
      console.error("❌ App initialization error:", e);
      const userInfoEl = document.getElementById("userInfo");
      const authBtn = document.getElementById("btnAuth");
      if (userInfoEl) {
        userInfoEl.innerHTML = "<span style='color:#ef4444;'>⚠️ Init failed. Please refresh the page.</span>";
      }
      if (authBtn) {
        authBtn.innerText = "Retry";
        authBtn.onclick = function () { location.reload(); };
      }
    }
  }
}

// 監聽認證狀態變化；「只」在 INITIAL_SESSION 時才 refreshAll()，避免 SIGNED_IN 時 session 尚未還原導致 4 次 getSession 逾時
sb.auth.onAuthStateChange(async (event, session) => {
  console.log("🔐 Auth state changed:", event);
  authStateReceived = true;
  if (event === "INITIAL_SESSION") {
    await refreshAll();
  }
});

// 頁面載入完成時初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}