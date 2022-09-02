const { MessageEmbed } = require("discord.js");

module.exports = class ClientEmbed extends MessageEmbed {
  constructor(user, guild, data = {}) {
    super(data);
    this.setColor(`#2f3136`)
  }
};