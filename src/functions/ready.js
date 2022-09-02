const { ClientRepository } = require('../database/Schemas');

module.exports = class {
  constructor(client) {
    this.client = client;
  }

  async run() {
    this.client.database.clientUtils = ClientRepository;

    setTimeout(async () => {
      const verify = (await this.client.database.clientUtils
        .findOne({ _id: this.client.user.id })
        .then(e => e))
        ? true
        : false;

      if (!verify)
        await this.client.database.clientUtils.create({
          _id: this.client.user.id
        });
      }, 4000);

    console.log(`🤖 » \x1b[36m[BOT ONLINE]\x1b[0m`, `Agora estou ligado, servindo á \x1b[35m${this.client.guilds.cache
      .map(x => x.memberCount)
      .reduce((x, f) => x + f, 0)
      .toLocaleString()} \x1b[37mpessoas.`);

    await this.client.application.commands.set(this.client.commands);
  }
};