console.log("=== Inspección de API Baileys 6.7.19 ===\n");

const baileys = require('@whiskeysockets/baileys');

// 1. Listar todas las exportaciones
console.log("🔍 Exportaciones principales:");
Object.keys(baileys)
  .sort()
  .forEach(key => {
    const value = baileys[key];
    const type = typeof value;
    const isFunc = type === 'function' ? 'ƒ' : '';
    const isObj = type === 'object' && value !== null ? '{}' : '';
    const isUndefined = value === undefined ? 'undefined' : '';
    
    console.log(`   ${key.padEnd(30)} ${isFunc || isObj || isUndefined || `[${type}]`}`);
  });

// 2. Buscar específicamente funciones de descifrado
console.log("\n🔑 Funciones de cifrado/descifrado:");
Object.keys(baileys)
  .filter(key => {
    const lower = key.toLowerCase();
    return lower.includes('crypt') || 
           lower.includes('decrypt') || 
           lower.includes('encrypt') ||
           lower.includes('media') ||
           lower.includes('key');
  })
  .forEach(key => {
    console.log(`   - ${key}`);
  });

// 3. Probar getMediaKeys específicamente
console.log("\n🧪 Probando getMediaKeys:");
if (baileys.getMediaKeys) {
  console.log("   ✅ getMediaKeys existe");
  
  // Probar con datos de prueba
  try {
    const testKey = Buffer.from('test'.repeat(8)); // 32 bytes
    const result = baileys.getMediaKeys(testKey, 'image');
    console.log("   🔍 Resultado de getMediaKeys:");
    console.log(`      Tipo: ${typeof result}`);
    console.log(`      ¿Objeto? ${result && typeof result === 'object' ? 'Sí' : 'No'}`);
    
    if (result && typeof result === 'object') {
      console.log("      Propiedades:");
      Object.keys(result).forEach(prop => {
        const val = result[prop];
        console.log(`        ${prop}: ${val ? `${val.constructor.name} (${val.length} bytes)` : 'null/undefined'}`);
      });
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }
} else {
  console.log("   ❌ getMediaKeys NO existe");
}

// 4. Buscar constantes de media
console.log("\n📁 Constantes de medios:");
Object.keys(baileys)
  .filter(key => {
    const value = baileys[key];
    return typeof value === 'object' && value !== null && 
           (key.includes('MEDIA') || key.includes('media'));
  })
  .forEach(key => {
    console.log(`   ${key}:`);
    if (baileys[key]) {
      Object.keys(baileys[key]).forEach(subKey => {
        console.log(`     - ${subKey}: ${baileys[key][subKey]}`);
      });
    }
  });

// 5. Verificar aesDecryptWithIV
console.log("\n🔐 aesDecryptWithIV:");
if (baileys.aesDecryptWithIV) {
  console.log("   ✅ aesDecryptWithIV existe");
  console.log(`   Parámetros esperados: ${baileys.aesDecryptWithIV.length}`);
} else {
  console.log("   ❌ aesDecryptWithIV NO existe");
}

console.log("\n=== Inspección completada ===");
