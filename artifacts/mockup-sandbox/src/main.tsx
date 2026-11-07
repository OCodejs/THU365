import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

if (typeof window !== "undefined" && "serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(new URL("sw.js", import.meta.env.BASE_URL), {
      scope: import.meta.env.BASE_URL,
    }).catch((error) => console.error("THU365 service worker registration failed:", error));
  });
}
