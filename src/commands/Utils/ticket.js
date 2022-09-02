const { Command } = require('../..');

module.exports = class TicketCommand extends Command {
  constructor(client) {
    super(
      {
        name: 'ticket',
        category: 'Utils',
        description: 'Configure o sistema de ticket.',
        usage: 'ticket <args>',
        aliases: [],

        reference: 'Ticket',

        options: [
          {
            type: 'SUB_COMMAND',
            name: 'categoria',
            description: '↳ Configure a categoria dos tickets.',
            options: [
              {
                type: 'CHANNEL',
                name: 'categoria',
                description: 'Escolha a categoria onde os tickets serão criados.',
                required: true
              }
            ]
          },
          {
            type: 'SUB_COMMAND',
            name: 'logs',
            description: '↳ Defina o canal de logs.',
            options: [
              {
                type: 'CHANNEL',
                name: 'canal',
                description: 'Mencione o canal ou forneça o ID.',
                required: true
              }
            ]
          },
          {
            type: 'SUB_COMMAND',
            name: 'setup',
            description: '↳ Envia a mensagem do ticket.'
          },
          {
            type: 'SUB_COMMAND',
            name: 'staff',
            description: '↳ Selecione o cargo para ver os tickets.',
            options: [
              {
                type: `ROLE`,
                name: 'cargo',
                description: 'Mencione o canal ou forneça o ID.',
                required: true
              }
            ]
          },
          {
            type: 'SUB_COMMAND',
            name: 'status',
            description: '↳ Ative ou desative o sistema de ticket.'
          }
        ]
      },
      client
    );
  }

  async run({ message, args }) {
    const subcommand =
      args[0] &&
      this.client.subcommands
        .get(this.reference)
        ?.find(
          cmd =>
            cmd.name.toLowerCase() === args[0].toLowerCase() ||
            cmd.aliases.includes(args[0].toLowerCase())
        );

    if (subcommand) return subcommand.run({ message, args });
  }
};