const { Command, Emojis } = require('../../../');

module.exports = class StaffSubCommand extends Command {
  constructor(client) {
    super(
      {
        name: 'staff',
        category: 'Utils',
        description: 'Altera o cargo das pessoas que terão acesso aos tickets criados.',
        usage: 'ticket staff <cargo>',
        aliases: [],

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

    const ROLE =
      message?.mentions?.roles?.first() ||
      message.guild.roles.cache.get(args[1]);

    if (!ROLE)
      return message.reply(
        `${message.author}, nenhum cargo encontrado.`
      );

    message.reply(
      `${message.author}, cargo alterado com sucesso.`
    );

    await this.client.database.clientUtils.findOneAndUpdate(
      { _id: this.client.user.id },
      { $set: { 'ticket.staff': ROLE.id } }
    );
  }
};