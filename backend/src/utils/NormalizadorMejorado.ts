// src/utils/NormalizadorMejorado.ts
import { WASocket } from "@whiskeysockets/baileys";
import { logger } from "../utils/logger";

export class NormalizadorMejorado {
  
  /**
   * Extrae el número de un JID en cualquier formato
   */
  private extraerNumeroDeJID(jid: string): string {
    // Si tiene @lid, extraer lo que está antes del @
    if (jid.includes('@lid')) {
      const parte = jid.split('@')[0];
      // Extraer solo dígitos por seguridad
      return parte.replace(/\D/g, '');
    }
    
    // Si tiene formato con : (ej: 5492478409220:0@lid)
    const match = jid.match(/^(\d+)[:\-]/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Si tiene @s.whatsapp.net
    if (jid.includes('@s.whatsapp.net')) {
      return jid.split('@')[0];
    }
    
    // Cualquier otro caso: solo números
    return jid.replace(/\D/g, '');
  }
  
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
      
      // Si es un LID (contiene :, @lid o . y no tiene @s.whatsapp.net)
      const esLid = jidDestino.includes(':') || jidDestino.includes('@lid') || (jidDestino.includes('.') && !jidDestino.includes('@s.whatsapp.net'));
      
      if (esLid) {
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
        
        // Si onWhatsApp falla, extraer el número del JID
        const posibleNumero = this.extraerNumeroDeJID(jidDestino);
        console.log('🔧 Extrayendo número de JID:', jidDestino, '->', posibleNumero);
        
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
      console.log('🔍 obtenerNumeroReal - JID recibido:', jid);
      
      // Si ya es un número tradicional
      if (jid.includes('@s.whatsapp.net')) {
        const numero = jid.split('@')[0];
        console.log('✅ Número tradicional extraído:', numero);
        return numero;
      }
      
      // Si es un LID (incluye @lid)
      const esLid = jid.includes(':') || jid.includes('@lid') || (jid.includes('.') && !jid.includes('@s.whatsapp.net'));
      
      if (esLid) {
        console.log('🔍 Detectado como LID:', jid);
        
        // Primero intentar con onWhatsApp
        try {
          const results = await sock.onWhatsApp(jid);
          if (results && results.length > 0 && results[0]?.exists) {
            const numero = results[0].jid.split('@')[0];
            console.log('✅ LID convertido con onWhatsApp:', jid, '->', numero);
            return numero;
          }
        } catch (error) {
          console.error('Error en onWhatsApp:', error);
        }
        
        // Si onWhatsApp falla, extraer número usando nuestro método
        const numeroExtraido = this.extraerNumeroDeJID(jid);
        console.log('🔧 Número extraído de JID:', jid, '->', numeroExtraido);
        
        // Para LIDs con @lid, si extraemos el mismo número (ej: 28308196585718)
        // es probable que sea incorrecto. Podemos marcar como placeholder
        if (jid.includes('@lid') && numeroExtraido.length > 12) {
          console.log('⚠️  LID largo detectado, posiblemente incorrecto');
          // Podríamos retornar un placeholder en lugar del LID crudo
          return `LID_${numeroExtraido.substring(0, 10)}`;
        }
        
        // Verificar si este número existe
        try {
          const results = await sock.onWhatsApp(numeroExtraido + '@s.whatsapp.net');
          if (results && results.length > 0 && results[0]?.exists) {
            const numeroVerificado = results[0].jid.split('@')[0];
            console.log('✅ Número extraído verificado:', numeroVerificado);
            return numeroVerificado;
          }
        } catch (error) {
          console.error('Error verificando número extraído:', error);
        }
        
        return numeroExtraido;
      }
      
      // Fallback final
      const numeroFinal = jid.replace(/\D/g, '');
      console.log('⚠️  Usando fallback final:', jid, '->', numeroFinal);
      return numeroFinal;
      
    } catch (error) {
      console.error('❌ Error en obtenerNumeroReal:', error);
      return jid.replace(/\D/g, '');
    }
  }
}