const { Command, Emojis } = require('../../../');

module.exports = class LogsSubCommand extends Command {
  constructor(client) {
    super(
      {
        name: 'logs',
        category: 'Utils',
        description: 'Altera o canal de logs dos ticket.',
        usage: 'ticket logs <canal>',
        aliases: ['registro'],

        reference: 'Ticket',

        subcommand: true
      },
      client
    );
  }

  async run({ message, args }) {
    if (!message.member.permissions.has('MANAGE_GUILD'))
      return message.reply(
        `${message.author}, sem permissão.`
      );

    const CHANNEL =
      message?.mentions?.channels?.first() ||
      message.guild.channels.cache.get(args[1]);

    if (!CHANNEL || CHANNEL.type != 'GUILD_TEXT')
      return message.reply(
        `${message.author}, insira o canal que deseja setar como o canal aonde será enviado as logs dos tickets.`
      );

    message.reply(
      `${message.author}, canal setado no canal ${CHANNEL} com sucesso.`
    );

    await this.client.database.clientUtils.findOneAndUpdate(
      { _id: this.client.user.id },
      { $set: { 'ticket.logs': CHANNEL.id } }
    );
  }
};