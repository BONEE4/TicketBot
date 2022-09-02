const { Command, ClientEmbed } = require('../../..');
const { MessageActionRow, MessageButton } = require('discord.js');

module.exports = class MsgSubCommand extends Command {
  constructor(client) {
    super(
      {
        name: 'setup',
        category: 'Utils',
        description: 'Envia a mensagem de ticket.',
        usage: 'ticket msg',
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

    const EMBED = new ClientEmbed()
      .setAuthor({
        name: `Atendimento ao usuário(a)`,
        iconURL: `https://cdn.discordapp.com/emojis/1015036953105813504.gif?size=128&quality=lossless`
      })
      .setDescription(
        `> Caso deseja falar em particular com nossa equipe sobre algum assunto abaixo, essa função te ajuda com isso, basta escolher a opção abaixo e prosseguir os passos.`
      );

    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setStyle('SECONDARY')
        .setLabel('Criar um Ticket')
        .setCustomId('openTicket')
    );

    const msg = await message.channel.send({
      embeds: [EMBED],
      components: [row],
      fetchReply: true
    });

    message.reply({
      content: `${message.author}, mensagem enviada com sucesso.`,
      ephemeral: true
    });

    await this.client.database.clientUtils.findOneAndUpdate(
      { _id: this.client.user.id },
      { $set: { 'ticket.channel': message.channel.id, 'ticket.msg': msg.id } }
    );
  }
};