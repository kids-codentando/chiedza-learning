/* Registers the service worker and tells the learner when they are offline. */
(function () {
  if ("serviceWorker" in navigator && /^https?:/.test(location.protocol) && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
  }
  let bar = null;
  function set() {
    if (!navigator.onLine) {
      if (!bar) { bar = document.createElement("div"); bar.className = "fx-offline no-print"; bar.textContent = "📴 Offline mode: lessons, quizzes and games still work"; document.body.appendChild(bar); }
    } else if (bar) { bar.remove(); bar = null; }
  }
  window.addEventListener("online", set); window.addEventListener("offline", set); set();
})();
