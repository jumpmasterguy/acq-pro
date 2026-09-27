import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { isNativeApp } from "./lib/platform";

// The static pages on this site (tools.html and friends) are plain HTML and
// cannot import isNativeApp(). This flag is how they know they are open inside
// the app: tools.html swaps its marketing header for a "Back to Acqlerate"
// link when it sees it. The app's storage is its own, never the phone
// browser's, so a website visitor never has it set.
try {
  if (isNativeApp()) localStorage.setItem("acq:native", "1");
} catch { /* storage unavailable: tools.html falls back to ?app=1 */ }

if (!window.location.hash) {
  window.location.hash = "#/";
}

// iOS keyboard fix: scroll focused input into view when keyboard opens
// Without this, the keyboard covers inputs and users can't see what they type
function scrollInputIntoView(e: Event) {
  const el = e.target as HTMLElement;
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
    // Small delay to let the keyboard finish animating up
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
  }
}
document.addEventListener('focusin', scrollInputIntoView);

// Register service worker for PWA / offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
