const CommandContext = require('../structures/commandcontext');

const GetMention = id => new RegExp(`^<@!?${id}>( |)$`);

module.exports = class messageCreate {
  constructor(client) {
    this.client = client;
  }

  async run(message) {
    if (message.author.bot || message.channel.type === 'DM') return;

    const prefix = '/';

    if (message.content.match(GetMention(this.client.user.id))) {
      message.reply(
        `> Olá ${message.author}, meu prefixo no servidor é **${prefix}**`
      );
    }

    if (message.content.indexOf(prefix) !== 0) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();

    const command =
      this.client.commands.get(cmd) ||
      this.client.commands.get(this.client.aliases.get(cmd));

    if (!command) return;

    const cooldown = this.client.cooldowns;

    const now = Date.now();
    const timestamps = cooldown.get(message.author.id);
    const cooldownAmount = 3000;

    if (timestamps && cooldown.has(message.author.id)) {
      const expirationTime = cooldown.get(message.author.id) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.reply(
          `> ${message.author}, aguarde **${timeLeft.toFixed(
            1
          )} segundos** para usar um comando novamente.`
        );
      }
    }

    if (!cooldown.has(message.author.id)) {
      cooldown.set(message.author.id, Date.now());

      setTimeout(() => {
        cooldown.delete(message.author.id);
      }, cooldownAmount);
    }

    const context = new CommandContext({
      message,
      args,
      author: message.author,
      prefix,
      command
    });

    command.executeCMD(context);
  }
};