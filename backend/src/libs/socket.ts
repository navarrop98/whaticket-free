import { Server as SocketIO } from "socket.io";
import { Server } from "http";
import { verify } from "jsonwebtoken";
import AppError from "../errors/AppError";
import { logger } from "../utils/logger";
import authConfig from "../config/auth";
import User from "../models/User";
import Queue from "../models/Queue";
import Ticket from "../models/Ticket";

let io: SocketIO;

export const initIO = (httpServer: Server): SocketIO => {
  logger.info("=== INITIO CALLED - WITH MIDDLEWARE ===");
  
  io = new SocketIO(httpServer, {
    cors: {
      origin: [process.env.FRONTEND_URL, "https://api.sistemasarrecifes.com.ar"],
      credentials: true
    },
    allowEIO3: true,
    transports: ["polling", "websocket"],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // ========== MIDDLEWARE (se ejecuta en CADA conexión) ==========
  io.use(async (socket, next) => {
    console.log("🟢🟢🟢 SOCKET.IO MIDDLEWARE EXECUTED!");
    logger.info("=== MIDDLEWARE EXECUTED ===");
    logger.info("Socket ID:", socket.id);
    logger.info("Handshake query:", socket.handshake.query);
    
    // Obtener token
    const tokenParam = socket.handshake.query?.token;
    logger.info("Token param:", tokenParam);
    
    if (!tokenParam) {
      logger.error("No token in middleware");
      return next(new Error("Authentication error"));
    }
    
    // Convertir a string
    let tokenString: string = "";
    if (Array.isArray(tokenParam)) {
      tokenString = tokenParam[0];
    } else if (typeof tokenParam === 'string') {
      tokenString = tokenParam;
    }
    
    // Quitar comillas si viene como JSON string
    if (tokenString.startsWith('"') && tokenString.endsWith('"')) {
      try {
        tokenString = JSON.parse(tokenString);
      } catch (e) {
        // Ignorar
      }
    }
    
    try {
      const tokenData = verify(tokenString, authConfig.secret);
      
      // Extraer user ID
      let userId: string = "";
      if (typeof tokenData === 'string') {
        try {
          const parsed = JSON.parse(tokenData);
          userId = parsed.id;
        } catch {
          return next(new Error("Invalid token format"));
        }
      } else {
        userId = (tokenData as any).id;
      }
      
      if (!userId) {
        return next(new Error("No user ID in token"));
      }
      
      // Adjuntar user ID al socket para uso posterior
      (socket as any).userId = userId;
      logger.info("Middleware SUCCESS - User ID:", userId);
      
      return next();
      
    } catch (error) {
      logger.error("Middleware authentication FAILED:", error);
      return next(new Error("Authentication error"));
    }
  });

  // ========== EVENT LISTENER (debería ejecutarse después del middleware) ==========
  io.on("connection", async socket => {
    console.log("🟢🟢🟢 CONNECTION EVENT FINALLY FIRED!");
    logger.info("=== CONNECTION EVENT ===");
    logger.info("Socket ID:", socket.id);
    logger.info("Attached user ID:", (socket as any).userId);
    
    const userId = (socket as any).userId;
    if (!userId) {
      logger.error("No user ID attached to socket");
      socket.disconnect();
      return;
    }
    
    const user = await User.findByPk(userId, { include: [Queue] });
    if (!user) {
      logger.error("User not found:", userId);
      socket.disconnect();
      return;
    }
    
    logger.info("Client Connected - User:", user.name);
    
    // ... (mantén el resto del código original: joinChatBox, joinNotification, etc.)
    socket.on("joinChatBox", (ticketId: string) => {
      if (ticketId === "undefined") return;
      Ticket.findByPk(ticketId).then(
        ticket => {
          if (ticket && (ticket?.userId === user.id || user.profile === "admin")) {
            logger.debug(`User ${user.id} joined ticket ${ticketId} channel`);
            socket.join(ticketId);
          } else {
            logger.info(`Invalid attempt to join ticket ${ticketId} by user ${user.id}`);
          }
        },
        error => logger.error(error, `Error fetching ticket ${ticketId}`)
      );
    });

    socket.on("joinNotification", () => {
      if (user.profile === "admin") {
        logger.debug(`Admin ${user.id} joined notification channel.`);
        socket.join("notification");
      } else {
        user.queues.forEach(queue => {
          logger.debug(`User ${user.id} joined queue ${queue.id} channel.`);
          socket.join(`queue-${queue.id}-notification`);
        });
      }
    });

    socket.on("joinTickets", (status: string) => {
      if (user.profile === "admin") {
        logger.debug(`Admin ${user.id} joined ${status} tickets channel.`);
        socket.join(`${status}`);
      } else {
        user.queues.forEach(queue => {
          logger.debug(`User ${user.id} joined queue ${queue.id} ${status} tickets channel.`);
          socket.join(`queue-${queue.id}-${status}`);
        });
      }
    });

    socket.on("disconnect", () => {
      logger.info("Client disconnected:", socket.id);
    });
    
    socket.emit("ready");
  });
  
  return io;
};

export const getIO = (): SocketIO => {
  if (!io) {
    throw new AppError("Socket IO not initialized");
  }
  return io;
};
