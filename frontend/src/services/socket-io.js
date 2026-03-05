import openSocket from "socket.io-client";
import { getBackendUrl } from "../config";

function connectToSocket() {
  const token = localStorage.getItem("token");
  
  // ✅ Validar que el token existe
  if (!token) {
    console.error("❌ No token found in localStorage");
    return null;
  }

  try {
    const parsedToken = JSON.parse(token);
    const backendUrl = getBackendUrl();
    
    if (!backendUrl) {
      console.error("❌ Backend URL not configured. Check REACT_APP_BACKEND_URL in .env");
      return null;
    }

    console.log(`✅ Connecting to socket at: ${backendUrl}`);
    
    const socket = openSocket(backendUrl, {
      query: {
        token: parsedToken,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected successfully");
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.warn("⚠️ Socket disconnected:", reason);
    });

    return socket;
  } catch (error) {
    console.error("❌ Error parsing token or connecting:", error);
    return null;
  }
}

export default connectToSocket;
