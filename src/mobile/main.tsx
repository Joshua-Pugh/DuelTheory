import React from "react";
import { createRoot } from "react-dom/client";
import MobileApp from "./MobileApp";
import "../styles.css";
import "../ashenLayered.css";
import "./mobile.css";
import "./mobileWorkbench.css";
import "./mobileDuel.css";
document.documentElement.classList.add("dt-mobile-app");
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MobileApp />
  </React.StrictMode>,
);
