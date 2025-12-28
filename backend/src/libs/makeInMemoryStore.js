// Implementación compatible con baileys para Whaticket
module.exports = function makeInMemoryStore(options = {}) {
  console.log('🔧 makeInMemoryStore() llamado, options:', Object.keys(options));
  const logger = options.logger || {
    debug: () => {},
    trace: () => {},
    info: () => {}
  };
  
  // Almacenamiento en memoria
  const messages = new Map(); // { "jid:id": message }
  const contacts = new Map();
  const chats = new Map();
  
  const store = {
    // Map de chats (accesible como wbot.store.chats)
    chats,
    // Map de mensajes (accesible como wbot.store.messages)
    messages,
    // Map de contactos (accesible como wbot.store.contacts)
    contacts,
    
    // Método para vincular con eventos de baileys
    bind(ev) {
      console.log('🔧 store.bind() llamado');
      if (ev && typeof ev.on === 'function') {
        // Escuchar nuevos mensajes
        ev.on('messages.upsert', ({ messages: newMessages }) => {
          if (newMessages && Array.isArray(newMessages)) {
            newMessages.forEach(msg => {
              if (msg.key && msg.key.remoteJid && msg.key.id) {
                const key = `${msg.key.remoteJid}:${msg.key.id}`;
                messages.set(key, msg);
              }
            });
          }
        });
        
        // Escuchar actualizaciones de contactos
        ev.on('contacts.update', (contactsUpdate) => {
          if (contactsUpdate && Array.isArray(contactsUpdate)) {
            contactsUpdate.forEach(contact => {
              if (contact.id) {
                contacts.set(contact.id, contact);
              }
            });
          }
        });
        
        // Escuchar cuando se establecen chats (inicialización)
        ev.on('chats.set', ({ chats: newChats }) => {
          if (newChats && Array.isArray(newChats)) {
            newChats.forEach(chat => {
              if (chat.id) {
                chats.set(chat.id, chat);
              }
            });
          }
        });
        
        // Escuchar actualizaciones de chats
        ev.on('chats.update', (chatsUpdate) => {
          if (chatsUpdate && Array.isArray(chatsUpdate)) {
            chatsUpdate.forEach(chatUpdate => {
              if (chatUpdate.id) {
                // Obtener chat existente o crear nuevo
                const existingChat = chats.get(chatUpdate.id) || {};
                // Fusionar actualizaciones manteniendo propiedades existentes
                const updatedChat = { 
                  unreadCount: 0, // Valor por defecto
                  ...existingChat, 
                  ...chatUpdate 
                };
                chats.set(chatUpdate.id, updatedChat);
                console.log('🔧 Chat actualizado:', chatUpdate.id, 'unreadCount:', updatedChat.unreadCount);
              }
            });
          }
        });
        
        // Log para debug
        ev.on('connection.update', (update) => {
          logger.debug('connection.update:', update.connection);
        });
      }
      logger.debug('store bound to ev');
      return store;
    },
    
    // Método para cargar un mensaje específico (requerido por wbot.ts)
    async loadMessage(remoteJid, id) {
      const key = `${remoteJid}:${id}`;
      const msg = messages.get(key);
      
      if (msg) {
        return msg.message || msg;
      }
      return undefined;
    },
    
    // Método para escribir/guardar un mensaje
    write(message) {
      if (message && message.key && message.key.remoteJid && message.key.id) {
        const key = `${message.key.remoteJid}:${message.key.id}`;
        messages.set(key, message);
      }
    },
    
    // Método para leer todos los mensajes de un JID
    readMessages(remoteJid) {
      const result = [];
      for (const [key, message] of messages.entries()) {
        if (key.startsWith(remoteJid + ':')) {
          result.push(message);
        }
      }
      return result;
    },
    
    // Método para obtener un mensaje por key (alternativa)
    getMessage(key) {
      if (key && key.remoteJid && key.id) {
        const mapKey = `${key.remoteJid}:${key.id}`;
        const msg = messages.get(mapKey);
        return msg ? msg.message || msg : undefined;
      }
      return undefined;
    },
    
    // Método para limpiar el store
    clear() {
      messages.clear();
      contacts.clear();
      chats.clear();
    },
    
    // Para compatibilidad
    toJSON() {
      return {
        messages: Array.from(messages.entries()).reduce((obj, [key, val]) => {
          obj[key] = val;
          return obj;
        }, {}),
        contacts: Array.from(contacts.entries()).reduce((obj, [key, val]) => {
          obj[key] = val;
          return obj;
        }, {}),
        chats: Array.from(chats.entries()).reduce((obj, [key, val]) => {
          obj[key] = val;
          return obj;
        }, {})
      };
    }
  };
  
  return store;
};
