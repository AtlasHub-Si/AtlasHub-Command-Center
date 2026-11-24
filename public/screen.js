(function () {
  const root = document.getElementById("atlas-screen");
  if (!root || !globalThis.AtlasLivingBackground) return;
  const controller = globalThis.AtlasLivingBackground.mount(root.querySelector("canvas"), {root, density:"hero", interactive:true, pulse:true});
  let manualPause = false;
  document.addEventListener("keydown", event => {
    if (event.code !== "Space" || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault(); manualPause = !manualPause;
    if (manualPause) controller.pause(); else controller.resume();
  });
  window.addEventListener("pagehide", event => { if (event.persisted) controller.pause(); else controller.destroy(); });
  window.addEventListener("pageshow", event => { if (event.persisted && !manualPause) controller.resume(); });
})();
