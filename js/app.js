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
      const msg = "連線到 Supabase 被中斷，請檢查：\n1. 是否有阻擋請求的瀏覽器擴充功能（如隱私/廣告阻擋），可先停用再試一次。\n2. 目前的網路環境（公司/校園防火牆、VPN）是否禁止連線到 Supabase。";
      if (typeof alert === "function") {
        alert(msg);
      }
      const userInfoEl = document.getElementById("userInfo");
      if (userInfoEl) {
        userInfoEl.innerHTML = "<span style='color:#f97316;'>⚠️ 無法連線到認證服務，請檢查瀏覽器外掛或網路環境後重新整理頁面。</span>";
      }
    } else {
      console.error("❌ App initialization error:", e);
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