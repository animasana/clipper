// The saved choice is "light" or "dark"; with nothing saved the site follows the OS setting.
export const themeStorageKey = "clipper-theme";

// Runs in <head> before first paint so dark-mode visitors never see a light flash.
export const themeInitScript = `(function () {
  try {
    var saved = localStorage.getItem(${JSON.stringify(themeStorageKey)});
    var dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();`;
