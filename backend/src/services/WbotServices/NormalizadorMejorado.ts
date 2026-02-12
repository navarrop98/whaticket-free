// src/utils/NormalizadorMejorado.ts
import { WASocket } from "@whiskeysockets/baileys";
// import { logger } from "../utils/logger";
const logger = console;

export class NormalizadorMejorado {
  
  /**
   * Normaliza un JID para envío, convirtiendo LIDs a números reales
   */
  async normalizarParaEnvio(sock: WASocket, jidDestino: string, companyId: number): Promise<string | null> {
    try {
      console.log('🔄 Normalizando JID para envío:', jidDestino);
      
      // Si ya es un número tradicional con @s.whatsapp.net, retornar tal cual
      if (jidDestino.includes('@s.whatsapp.net')) {
        console.log('✅ JID ya normalizado (tradicional):', jidDestino);
        return jidDestino;
      }
      
      // Si es un LID (contiene : o . y no tiene @s.whatsapp.net)
      if (jidDestino.includes(':') || (jidDestino.includes('.') && !jidDestino.includes('@s.whatsapp.net'))) {
        console.log('🔍 Detectado LID, buscando número real...');
        
        // Intentar usar onWhatsApp para obtener el número real
        try {
          const results = await sock.onWhatsApp(jidDestino);
          
          if (results && results.length > 0 && results[0]?.exists) {
            const numeroReal = results[0].jid;
            console.log('✅ LID convertido a número real:', jidDestino, '->', numeroReal);
            return numeroReal;
          }
        } catch (error) {
          console.error('❌ Error usando onWhatsApp:', error);
        }
        
        // Si onWhatsApp falla, intentar extraer el número del LID
        // Los LIDs suelen tener formato: 5492478409220:0@lid o similar
        const match = jidDestino.match(/^(\d+)[:\-]/);
        if (match && match[1]) {
          const posibleNumero = match[1];
          console.log('🔧 Extrayendo número de LID:', jidDestino, '->', posibleNumero);
          
          // Verificar si este número existe en WhatsApp
          try {
            const results = await sock.onWhatsApp(posibleNumero + '@s.whatsapp.net');
            if (results && results.length > 0 && results[0]?.exists) {
              const jidCompleto = results[0].jid;
              console.log('✅ Número extraído válido:', jidCompleto);
              return jidCompleto;
            }
          } catch (error) {
            console.error('❌ Error verificando número extraído:', error);
          }
          
          // Si no podemos verificar, al menos formatear como número tradicional
          return posibleNumero + '@s.whatsapp.net';
        }
      }
      
      // Si no es LID pero no tiene @s.whatsapp.net, agregarlo
      if (!jidDestino.includes('@')) {
        const jidNormalizado = jidDestino + '@s.whatsapp.net';
        console.log('🔧 Agregando dominio a JID:', jidDestino, '->', jidNormalizado);
        return jidNormalizado;
      }
      
      // Si llegamos aquí, retornar el JID original
      console.log('⚠️  No se pudo normalizar, usando original:', jidDestino);
      return jidDestino;
      
    } catch (error) {
      console.error('❌ Error en normalizador:', error);
      return jidDestino;
    }
  }
  
  /**
   * Obtiene el número real de un JID (LID o tradicional)
   */
  async obtenerNumeroReal(sock: WASocket, jid: string): Promise<string> {
    try {
      // Si ya es un número tradicional
      if (jid.includes('@s.whatsapp.net')) {
        return jid.split('@')[0];
      }
      
      // Si es un LID
      if (jid.includes(':') || (jid.includes('.') && !jid.includes('@s.whatsapp.net'))) {
        try {
          const results = await sock.onWhatsApp(jid);
          if (results && results.length > 0 && results[0]?.exists) {
            return results[0].jid.split('@')[0];
          }
        } catch (error) {
          console.error('Error en obtenerNumeroReal:', error);
        }
        
        // Fallback: extraer número del LID
        const match = jid.match(/^(\d+)[:\-]/);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      // Fallback final
      return jid.replace(/\D/g, '');
      
    } catch (error) {
      console.error('Error en obtenerNumeroReal:', error);
      return jid.replace(/\D/g, '');
    }
  }
}