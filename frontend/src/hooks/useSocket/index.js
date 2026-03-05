import { useEffect, useState } from "react";
import connectToSocket from "../../services/socket-io";

const useProvideSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Obtener la instancia única del socket
    const socketInstance = connectToSocket();

    if (socketInstance) {
      setSocket(socketInstance);

      // Escuchar cuando está listo
      socketInstance.on("ready", () => {
        console.log("✅ Socket ready event received");
      });

      // Cleanup al desmontar
      return () => {
        if (socketInstance) {
          socketInstance.off("ready");
        }
      };
    } else {
      console.warn("⚠️ Socket instance is null - check token and backend URL");
    }
  }, []);

  // Retorna una función que obtiene el socket
  // Esto permite que los componentes llamen socketProvider() para obtener la instancia
  return () => socket;
};

export default useProvideSocket;
