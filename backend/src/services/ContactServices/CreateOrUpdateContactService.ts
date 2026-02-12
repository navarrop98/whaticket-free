import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";

interface Extrainfo {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  isGroup: boolean;
  email?: string;
  profilePicUrl?: string;
  extrainfo?: Extrainfo[];
  companyId?: number;
  lid?: string | null;
  originalJid?: string | null;
  whatsappId?: number;
}

// REEMPLAZA desde la línea donde se declara 'let contact' hasta el final

const CreateOrUpdateContactService = async ({
  name,
  number: rawNumber,
  profilePicUrl,
  isGroup,
  email = "",
  extrainfo = [],
  companyId,
  lid = null,
  originalJid = null,
  whatsappId
}: Request): Promise<Contact> => {
 // ========== LOGGING DETALLADO ==========
  console.log('🔍 CreateOrUpdateContactService - DATOS RECIBIDOS:');
  console.log('   name:', name);
  console.log('   rawNumber:', rawNumber);
  console.log('   isGroup:', isGroup);
  console.log('   companyId:', companyId);
  console.log('   lid:', lid);
  console.log('   originalJid:', originalJid);
  console.log('   whatsappId:', whatsappId);
  // ========== FIN LOGGING ==========


  const number = isGroup ? rawNumber : rawNumber.replace(/[^0-9]/g, "");

  const io = getIO();
  
  // 1. Buscar contacto existente
  const whereClause: any = { number };
  if (companyId) {
    whereClause.companyId = companyId;
  }

  let contact = await Contact.findOne({ where: whereClause });

  // 2. Si existe, actualizarlo
  if (contact) {
    try {
      const updateData: any = {
        name,
        profilePicUrl: profilePicUrl || contact.profilePicUrl
      };

      if (email) updateData.email = email;
      if (extrainfo && extrainfo.length > 0) updateData.extrainfo = extrainfo;
      if (lid !== undefined) updateData.lid = lid;
      if (originalJid !== undefined) updateData.originalJid = originalJid;
      if (whatsappId !== undefined) updateData.whatsappId = whatsappId;

      await contact.update(updateData);

      io.emit("contact", {
        action: "update",
        contact
      });
      
      return contact;  // <-- Retornar aquí si se actualizó
      
    } catch (error) {
      console.error('Error actualizando contacto:', error);
      throw error;  // <-- Importante: propagar el error
    }
  }

  // 3. Si no existe, crearlo
  try {
    contact = await Contact.create({
      name,
      number,
      profilePicUrl,
      email,
      isGroup,
      extrainfo,
      companyId,
      lid,
      originalJid,
      whatsappId
    });

    io.emit("contact", {
      action: "create",
      contact
    });

    return contact;  // <-- Retornar el contacto creado
    
  } catch (error) {
    console.error('Error creando contacto:', error);
    throw error;  // <-- Propagar el error
  }
};

export default CreateOrUpdateContactService;
