const { connect } = require("mongoose");

module.exports = {
  start() {
    try {
      connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log(`📡 » \x1b[36m[DATABASE CONECTADA]\x1b[0m`, `Bot conectado no banco de dados com sucesso.`);
    } catch (err) {
      if (err) return console.log(`🚨 » [DATABASE ERROR]:`, err);
    }
  },
};