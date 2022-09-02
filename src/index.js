const { Collection, ClientEmbed, Emojis } = require("./utils");

module.exports = {
  Collection: Collection,
  ClientEmbed: ClientEmbed,
  Emojis: Emojis,

  Command: require("./structures/command"),
};