import { WASocket } from "@whiskeysockets/baileys";
import { Store } from "../libs/store";
import { getWbot } from "../libs/wbot";
import Whatsapp from "../models/Whatsapp";

export type Session = WASocket & {
  id?: number;
  store?: Store;
};

const GetWhatsappWbot = async (whatsapp: Whatsapp): Promise<Session> => {
  try {
    const wbot = await getWbot(whatsapp.id);
    
    if (!wbot) {
      throw new Error(`WhatsApp bot not found for ID: ${whatsapp.id}`);
    }
    
    return wbot;
  } catch (error) {
    console.error(`Error getting WhatsApp bot for ID ${whatsapp.id}:`, error);
    throw error;
  }
};

export default GetWhatsappWbot;