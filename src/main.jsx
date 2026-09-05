import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ToastProvider } from "./context/ToastContext";
import { UnreadCountsProvider } from "./context/UnreadCountsContext";
import { initMonitoring } from "./lib/monitoring";
import "./index.css";

// Before the tree renders, so a crash during the first paint is still
// reported rather than lost.
initMonitoring();

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
