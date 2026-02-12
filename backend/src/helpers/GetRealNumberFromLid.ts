import BaileysSessions from "../models/BaileysSessions";
import { Op } from 'sequelize';

interface MappingResult {
  realNumber: string;
  isLid: boolean;
  original: string;
  lidNumber?: string;
  foundInBaileysSessions: boolean;
}

function extractStringValue(value: any): string | null {
  try {
    if (value === null || value === undefined) return null;
    
    if (typeof value === 'string') {
      return value.replace(/^"|"$/g, '').trim();
    }
    
    if (typeof value === 'object') {
      const stringValues = Object.values(value).filter(v => typeof v === 'string');
      if (stringValues.length > 0) {
        return (stringValues[0] as string).replace(/^"|"$/g, '').trim();
      }
      
      const str = JSON.stringify(value);
      const match = str.match(/"([^"\\]*(?:\\.[^"\\]*)*)"/);
      if (match) return match[1].replace(/\\"/g, '"').trim();
      return str.replace(/^"|"$/g, '').trim();
    }
    
    return String(value).replace(/^"|"$/g, '').trim();
  } catch (error) {
    console.error('[extractStringValue] Error:', error);
    return null;
  }
}

const GetRealNumberFromLid = async (
  sessionId: string, 
  lidOrNumber: string
): Promise<MappingResult> => {
  console.log(`\n🔍 [GetRealNumberFromLid] INICIANDO BUSQUEDA`);
  console.log(`   Input: "${lidOrNumber}"`);
  console.log(`   SessionId: "${sessionId}"`);
  
  try {
    let cleanInput = lidOrNumber;
    if (lidOrNumber.includes('@')) cleanInput = lidOrNumber.split('@')[0];
    
    console.log(`   Clean input: "${cleanInput}" (${cleanInput.length} dígitos)`);
    
    const isNormalNumber = cleanInput.length <= 15 && /^\d+$/.test(cleanInput);
    console.log(`   Tipo: ${isNormalNumber ? 'Número normal' : 'Posible LID'}`);
    
    // 🎯 BUSCAR MAPPING EXACTO
    const exactReverseKey = `lid-mapping-${cleanInput}_reverse`;
    console.log(`\n🔍 Buscando mapping exacto: ${exactReverseKey}`);
    
    const exactMappings = await BaileysSessions.findAll({
      where: { name: exactReverseKey },
      order: [['whatsappId', 'DESC'], ['updatedAt', 'DESC']]
    });
    
    if (exactMappings.length > 0) {
      console.log(`✅ Encontrado ${exactMappings.length} mapping(s) exacto(s)`);
      const mapping = exactMappings[0];
      const realNumber = extractStringValue(mapping.value);
      
      if (realNumber) {
        console.log(`   whatsappId: ${mapping.whatsappId}`);
        console.log(`   value: "${realNumber}"`);
        console.log(`🎯 ÉXITO: ${cleanInput} -> ${realNumber}`);
        return {
          realNumber,
          isLid: true,
          original: lidOrNumber,
          lidNumber: cleanInput,
          foundInBaileysSessions: true
        };
      }
      console.log(`   ⚠️ No se pudo extraer el valor`);
    } else {
      console.log(`   ⚠️ No se encontró mapping exacto`);
    }
    
    // 🎯 BUSCAR COINCIDENCIAS PARCIALES
    console.log(`\n🔍 Buscando coincidencias parciales...`);
    const allReverseMappings = await BaileysSessions.findAll({
      where: { name: { [Op.like]: 'lid-mapping-%_reverse' } },
      order: [['whatsappId', 'DESC'], ['updatedAt', 'DESC']]
    });
    
    console.log(`   Total mappings: ${allReverseMappings.length}`);
    
    for (const mapping of allReverseMappings) {
      if (!mapping.name) continue;
      const lidFromKey = mapping.name.replace('lid-mapping-', '').replace('_reverse', '');
      const minLength = Math.min(lidFromKey.length, cleanInput.length);
      
      if (minLength >= 6) {
        const inputStart = cleanInput.substring(0, minLength);
        const lidStart = lidFromKey.substring(0, minLength);
        
        if (inputStart === lidStart) {
          console.log(`✅ Coincidencia primeros ${minLength} dígitos`);
          console.log(`   LID BD: ${lidFromKey} (${lidFromKey.length})`);
          console.log(`   Input: ${cleanInput} (${cleanInput.length})`);
          
          const realNumber = extractStringValue(mapping.value);
          if (realNumber) {
            console.log(`   whatsappId: ${mapping.whatsappId}`);
            console.log(`   Número: "${realNumber}"`);
            console.log(`🎯 CONVERTIDO: ${cleanInput} -> ${realNumber}`);
            return {
              realNumber,
              isLid: true,
              original: lidOrNumber,
              lidNumber: lidFromKey,
              foundInBaileysSessions: true
            };
          }
          console.log(`   ⚠️ No se pudo extraer número de: ${mapping.value}`);
        }
      }
    }
    
    // 🎯 BUSCAR SI EL INPUT ES NÚMERO CON LID ASOCIADO
    if (isNormalNumber) {
      console.log(`\n🔍 Buscando LID para número: ${cleanInput}`);
      const directMapping = await BaileysSessions.findOne({
        where: { name: `lid-mapping-${cleanInput}` }
      });
      
      if (directMapping) {
        console.log(`✅ Número tiene LID asociado`);
        const lidNumber = extractStringValue(directMapping.value);
        if (lidNumber) {
          console.log(`   LID: "${lidNumber}"`);
          return {
            realNumber: cleanInput,
            isLid: false,
            original: lidOrNumber,
            lidNumber,
            foundInBaileysSessions: true
          };
        }
        console.log(`   ⚠️ No se pudo extraer LID de: ${directMapping.value}`);
      }
      console.log(`   ℹ️ No se encontró LID para número ${cleanInput}`);
    }
    
    // NO SE ENCONTRÓ
    console.log(`\n⚠️ No se encontró mapping para: ${cleanInput}`);
    console.log(`   Devolviendo input original`);
    return {
      realNumber: cleanInput,
      isLid: cleanInput.length > 12,
      original: lidOrNumber,
      foundInBaileysSessions: false
    };
    
  } catch (error) {
    console.error(`❌ [GetRealNumberFromLid] ERROR:`, error);
    return {
      realNumber: lidOrNumber,
      isLid: false,
      original: lidOrNumber,
      foundInBaileysSessions: false
    };
  }
};

export default GetRealNumberFromLid;
