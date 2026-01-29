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