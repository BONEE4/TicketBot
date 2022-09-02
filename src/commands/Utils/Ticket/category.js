const { Command, Emojis } = require('../../../');

module.exports = class CategorySubCommand extends Command {
  constructor(client) {
    super(
      {
        name: 'category',
        category: 'Utils',
        description: 'Altera a categoria aonde os tickets são criados.',
        usage: 'ticket categoria <categoria>',
        aliases: ['categoria'],

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

    const CATEGORY =
      message?.mentions?.channels?.first() ||
      message.guild.channels.cache.get(args[1]);

    // message.guild.channels.cache.find(
    //   x => x.name.toLowerCase() === args.slice(1).join(' ').toLowerCase()
    // ) || message.guild.channels.cache.get(args[1]);

    if (CATEGORY.type != 'GUILD_CATEGORY')
      return message.reply(
        `${message.author}, o canal deve ser uma categoria aonde os tickets serão criados.`
      );

    message.reply(
      `${message.author}, categoria de criação dos tickets alterado com sucesso.`
    );

    await this.client.database.clientUtils.findOneAndUpdate(
      { _id: this.client.user.id },
      { $set: { 'ticket.category': CATEGORY.id } }
    );
  }
};