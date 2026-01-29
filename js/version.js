// 🔖 Version Management - 手動版號

const VERSION_CONFIG = {
  major: 1,
  minor: 0,
  patch: 0,
  build: 1,
};

function getFullVersion() {
  return `v${VERSION_CONFIG.major}.${VERSION_CONFIG.minor}.${VERSION_CONFIG.patch}.${VERSION_CONFIG.build}`;
}

function initVersionDisplay() {
  const versionDiv = document.getElementById('versionDisplay');
  const footerVersion = document.getElementById('footerVersion');
  
  if (!versionDiv || !footerVersion) return;
  
  const version = getFullVersion();
  versionDiv.innerText = version;
  footerVersion.innerText = version;
}

document.addEventListener('DOMContentLoaded', initVersionDisplay);