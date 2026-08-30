import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ToastProvider } from "./context/ToastContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
