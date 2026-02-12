console.log("=== Test de importación Baileys 6.7.19 (LOCAL) ===");
try {
    const baileys = require('@whiskeysockets/baileys');
    console.log("✅ Módulo importado con éxito.");
    console.log("✅ Función 'downloadMediaMessage' disponible:", typeof baileys.downloadMediaMessage === 'function');
    
    // Verificar la ruta y versión del paquete
    const path = require('path');
    const baileysPath = require.resolve('@whiskeysockets/baileys');
    const pkg = require(path.join(baileysPath, '../../package.json'));
    console.log(`✅ Versión confirmada: ${pkg.version}`);
} catch (error) {
    console.error("❌ Error en la importación:", error.message);
}
