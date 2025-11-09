let _overlay = null;

export function showLoading(message = "Loading...") {
  if (!_overlay) {
    _overlay = document.createElement("div");
    _overlay.id = "global-loading";
    _overlay.style.position = "fixed";
    _overlay.style.inset = "0";
    _overlay.style.background = "rgba(0,0,0,0.25)";
    _overlay.style.display = "flex";
    _overlay.style.alignItems = "center";
    _overlay.style.justifyContent = "center";
    _overlay.style.zIndex = "99999";
    _overlay.innerHTML = `<div style="background:#fff;padding:18px 22px;border-radius:10px;display:flex;gap:12px;align-items:center;box-shadow:0 6px 18px rgba(0,0,0,0.12);">
      <svg width="28" height="28" viewBox="0 0 50 50" style="animation:spin 1s linear infinite"><circle cx="25" cy="25" r="20" stroke="#4f7f65" stroke-width="6" stroke-linecap="round" fill="none" stroke-dasharray="31.4 31.4"/></svg>
      <div style="font-weight:600;color:#222">${message}</div>
    </div>`;
    const style = document.createElement("style");
    style.textContent = `@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`;
    document.head.appendChild(style);
    document.body.appendChild(_overlay);
  } else {
    _overlay.style.display = "flex";
    const txt = _overlay.querySelector("div > div");
    if (txt) txt.textContent = message;
  }
}

export function hideLoading() {
  if (_overlay) _overlay.style.display = "none";
}

export default { showLoading, hideLoading };
