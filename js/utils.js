// 🛠️ Utility Functions
const $ = (id) => document.getElementById(id);

function checkBrowser() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.indexOf('line') > -1 || ua.indexOf('fban') > -1 || ua.indexOf('fbav') > -1) {
    $("browserNotice").style.display = "block";
  }
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString('zh-TW', {hour12:false}).slice(5, 16);
}

function showAlert(message) {
  alert(message);
}

let toastTimeout = null;

function showStampToast(missionTitle, points) {
  const el = document.getElementById("toast");
  const iconEl = document.getElementById("toastIcon");
  const msgEl = document.getElementById("toastMessage");
  if (!el || !msgEl) return;
  if (toastTimeout) clearTimeout(toastTimeout);
  if (iconEl) {
    iconEl.textContent = "📌";
    iconEl.className = "toast-icon";
  }
  const ptsStr = points != null ? ` +${points} pt` : "";
  msgEl.textContent = `Stamp earned! ${missionTitle || "Task"}${ptsStr}`;
  el.style.display = "flex";
  el.classList.remove("is-visible");
  el.offsetHeight;
  el.classList.add("is-visible");
  toastTimeout = setTimeout(() => {
    el.classList.remove("is-visible");
    toastTimeout = setTimeout(() => {
      el.style.display = "none";
      toastTimeout = null;
    }, 300);
  }, 3500);
}

function showLevelUpToast(rankLabel) {
  const el = document.getElementById("toast");
  const iconEl = document.getElementById("toastIcon");
  const msgEl = document.getElementById("toastMessage");
  if (!el || !msgEl) return;
  if (toastTimeout) clearTimeout(toastTimeout);
  if (iconEl) {
    iconEl.textContent = "🏆";
    iconEl.className = "toast-icon";
  }
  msgEl.textContent = `You reached ${rankLabel || "new level"}!`;
  el.style.display = "flex";
  el.classList.remove("is-visible");
  el.offsetHeight;
  el.classList.add("is-visible");
  toastTimeout = setTimeout(() => {
    el.classList.remove("is-visible");
    toastTimeout = setTimeout(() => {
      el.style.display = "none";
      toastTimeout = null;
    }, 250);
  }, 3000);
}

function showRewardToast(rewardTitle) {
  const el = document.getElementById("toast");
  const iconEl = document.getElementById("toastIcon");
  const msgEl = document.getElementById("toastMessage");
  if (!el || !msgEl) return;
  if (toastTimeout) clearTimeout(toastTimeout);
  if (iconEl) {
    iconEl.textContent = "🎁";
    iconEl.className = "toast-icon";
  }
  msgEl.textContent = `Reward claimed: ${rewardTitle || "Reward"}`;
  el.style.display = "flex";
  el.classList.remove("is-visible");
  el.offsetHeight;
  el.classList.add("is-visible");
  toastTimeout = setTimeout(() => {
    el.classList.remove("is-visible");
    toastTimeout = setTimeout(() => {
      el.style.display = "none";
      toastTimeout = null;
    }, 250);
  }, 2500);
}