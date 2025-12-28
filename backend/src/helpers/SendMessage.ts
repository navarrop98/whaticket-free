import mime from "mime-types";
import fs from "fs";
import { AnyMessageContent } from "@whiskeysockets/baileys";
import Whatsapp from "../models/Whatsapp";
import GetWhatsappWbot from "./GetWhatsappWbot";
import SendWhatsAppMedia, {
  processAudio,
  processAudioFile
} from "../services/WbotServices/SendWhatsAppMedia";

export type MessageData = {
  number: number | string;
  body: string;
  mediaPath?: string;
};

export const SendMessage = async (
  whatsapp: Whatsapp,
  messageData: MessageData
): Promise<any> => {
  try {
    const wbot = await GetWhatsappWbot(whatsapp);
    
    if (!wbot) {
      throw new Error("WhatsApp bot is not initialized");
    }
    
    const jid = `${messageData.number}@s.whatsapp.net`;
    let message: any;
    const body = `\u200e${messageData.body}`;
    
    console.log("Enviando mensaje a:", jid);

    if (messageData.mediaPath) {
      // Verificar si el archivo existe
      if (!fs.existsSync(messageData.mediaPath)) {
        throw new Error(`Media file not found: ${messageData.mediaPath}`);
      }

      const mimetype = mime.lookup(messageData.mediaPath) || "application/octet-stream";
      const media = {
        path: messageData.mediaPath,
        mimetype,
        originalname: messageData.mediaPath.split("/").pop() || "file"
      };

      console.log("Media detected:", media);
      const pathMedia = messageData.mediaPath;
      const typeMessage = media.mimetype.split("/")[0];
      let options: AnyMessageContent;

      switch (typeMessage) {
        case "video":
          options = {
            video: fs.readFileSync(pathMedia),
            caption: body,
            fileName: media.originalname
          };
          break;
        
        case "audio":
          const typeAudio = media.originalname.includes("audio-record-site");
          let audioPath: string;
          
          if (typeAudio) {
            audioPath = await processAudio(media.path);
          } else {
            audioPath = await processAudioFile(media.path);
          }
          
          options = {
            audio: fs.readFileSync(audioPath),
            mimetype: typeAudio ? "audio/mp4" : media.mimetype,
            ptt: typeAudio // push-to-talk solo para grabaciones
          };
          break;
        
        case "document":
        case "application":
          options = {
            document: fs.readFileSync(pathMedia),
            caption: body,
            fileName: media.originalname,
            mimetype: media.mimetype
          };
          break;
        
        default:
          // Para imágenes y otros tipos
          options = {
            image: fs.readFileSync(pathMedia),
            caption: body
          };
      }

      message = await wbot.sendMessage(jid, options);
      console.log("Media message sent:", message.key.id);

    } else {
      // Mensaje de texto simple
      console.log("Text message body:", body);
      message = await wbot.sendMessage(jid, { text: body });
    }

    return message;
    
  } catch (err: any) {
    console.error("Error in SendMessage:", err);
    // Mejor manejo del error
    if (err instanceof Error) {
      throw new Error(`Failed to send message: ${err.message}`);
    } else {
      throw new Error("Failed to send message: Unknown error");
    }
  }
};