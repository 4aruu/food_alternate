import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { clearLegacyStorage } from "./utils/legacyStorage";

import "./styles/index.css";

// Delete data the removed mock login/registration flow left in browsers
// (including a plaintext password). Accessing localStorage can throw when
// storage is blocked, so guard the access itself.
let browserStorage = null;
try {
  browserStorage = window.localStorage;
} catch {
  browserStorage = null;
}
clearLegacyStorage(browserStorage);

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
