import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ToastProvider } from "./context/ToastContext";
import { UnreadCountsProvider } from "./context/UnreadCountsContext";
import { initMonitoring } from "./lib/monitoring";
import { installStaleDeployRecovery } from "./lib/staleDeploy";
import { warmApi } from "./lib/warmApi";
import "./index.css";

// Before the tree renders, so a crash during the first paint is still
// reported rather than lost.
initMonitoring();

// Also before the tree renders: on free hosting the API may be asleep, and
// this is the earliest moment the thirty-second wake-up can start.
warmApi();

// Before the first render, so a chunk that went missing in a deploy is
// caught at the fetch rather than after React has already given up on the
// route.
installStaleDeployRecovery();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <UnreadCountsProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </UnreadCountsProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
