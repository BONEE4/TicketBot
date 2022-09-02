const ClientEmbed = require('../utils/embed');

module.exports = class Command {
  constructor(options = {}, client) {
    this.client = client;

    this.name = options.name;
    this.aliases = options.aliases || [];

    this.category = options.category;
    this.description = options.description || '';
    this.usage = options.usage || '';

    this.options = options.options;

    this.reference = options.reference || '';
    this.subcommand = options.subcommand || false;
  }

  async executeCMD(context) {
    try {
      await this.run(context);
    } catch (error) {
      await this.errorCommand(context, error);
      console.log(error);
    }
  }

  async errorCommand({ message, author, command }, error) {
    const EMBED = new ClientEmbed(author)
      .setTitle(`❌| Erro`)
      .addFields(
        {
          name: `Comando:`,
          value: command.name,
          inline: true
        },
        {
          name: `Usado por:`,
          value: author.tag,
          inline: true
        },
        {
          name: `Logs:`,
          value: `\`\`\`${error.message}\`\`\``
        }
      )
      .setThumbnail(
        author.displayAvatarURL({ dynamic: true, format: 'png', size: 2048 })
      );

    return message.reply({ embeds: [EMBED] });
  }
};