const { Command, Emojis } = require('../../../');

module.exports = class StatusSubCommand extends Command {
  constructor(client) {
    super(
      {
        name: 'status',
        category: 'Utils',
        description: 'Sistema de Ticket do Bot.',
        usage: 'ticket <args>',

        aliases: [],

        reference: 'Ticket',
        subcommand: true
      },
      client
    );
  }

  async run({ message }) {
    if (!message.member.permissions.has('MANAGE_GUILD'))
      return message.reply(
        `${message.author}, sem permissão.`
      );

    const { ticket } = await this.client.database.clientUtils.findOne({
      _id: this.client.user.id
    });

    const change = async () => {
      await this.client.database.clientUtils.findOneAndUpdate(
        { _id: this.client.user.id },
        { $set: { 'ticket.status': ticket.status ? false : true } }
      );
    };

    if (!ticket.status)
      return message
        .reply(
          `${message.author}, sistema ativado com sucesso.`
        )
        .then(async () => {
          return await change();
        });
    else
      return message
        .reply(
          `${message.author}, sistema desativado com sucesso.`
        )
        .then(async () => {
          return await change();
        });
  }
};