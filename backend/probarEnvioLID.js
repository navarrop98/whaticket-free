const { default: makeWASocket } = require('@whiskeysockets/baileys');
const { Sequelize } = require('sequelize');

async function probarEnvioLID() {
  console.log('🧪 PROBANDO ENVÍO USANDO MAPPING LID');
  
  try {
    // 1. Conectar a BD para obtener el mapping
    const sequelize = new Sequelize('unkbot', 'unkbot', 'TuPasswordSeguro1', {
      host: 'localhost',
      dialect: 'postgres',
      logging: false
    });
    
    // 2. Buscar mapping del LID
    const resultado = await sequelize.query(
      `SELECT value::text as numero_real FROM "BaileysSessions" 
       WHERE name = 'lid-mapping-28308196585718_reverse' AND "whatsappId" = 10`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (resultado.length === 0) {
      console.log('❌ No se encontró mapping para LID 28308196585718');
      return;
    }
    
    const numeroReal = JSON.parse(resultado[0].numero_real);
    console.log('✅ Mapping encontrado:');
    console.log('   LID: 28308196585718');
    console.log('   Número real:', numeroReal);
    console.log('   JID para enviar:', `${numeroReal}@s.whatsapp.net`);
    
    // 3. Cargar sesión WhatsApp (necesitaríamos las creds)
    console.log('\n⚠️  Para probar envío real necesitamos:');
    console.log('   a) Cargar sesión WhatsApp desde BD');
    console.log('   b) Conectar socket');
    console.log('   c) Enviar mensaje de prueba');
    
    console.log('\n🎯 CONCLUSIÓN: El mapping existe y deberíamos usarlo en el código.');
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

probarEnvioLID().catch(console.error);
