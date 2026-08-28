import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

// Socket.IO's own path lives at the server root, not under /api - derive
// the base origin from the same env var api.js uses so there's only one
// place that knows the backend's URL.
const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    let cancelled = false;

    // socket.io-client is a meaningfully large dependency (it added ~13kB
    // gzipped to the main bundle when imported eagerly) that only matters
    // to logged-in users - dynamic import keeps it out of the bundle every
    // logged-out visitor downloads, consistent with this app's existing
    // route-based code splitting.
    import("socket.io-client").then(({ io }) => {
      if (cancelled) return;

      const newSocket = io(SOCKET_URL, {
        auth: { token },
        // Real-time is a best-effort latency improvement here, not a
        // guarantee (see backend README) - reconnect indefinitely with
        // capped backoff rather than giving up, since the service coming
        // back from a free-tier sleep is exactly when we want it to retry.
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    });

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
