const { ClientEmbed } = require('../');
const CommandContext = require('../structures/commandcontext');
const {
  MessageActionRow,
  MessageButton
} = require('discord.js');
const hastebin = require('hastebin');
const listUsers = new Set();

module.exports = class interactionCreate {
  constructor(client) {
    this.client = client;
  }

  async run(interaction) {
    if (interaction.isCommand()) {
      if (!interaction.guild) return;
      const command = this.client.commands.get(interaction.commandName);

      interaction.author = interaction.user;

      const args = [];

      for (const option of interaction.options.data) {
        if (option.type === 'SUB_COMMAND_GROUP') {
          if (option.name) args.push(option.name);
          option.options?.forEach(x => {
            if (x.name) args.push(x.name);

            if (x.options[0]) args.push(x.options[0].value);
          });
        } else if (option.type === 'SUB_COMMAND') {
          if (option.name) args.push(option.name);
          option.options?.forEach(x => {
            if (x.value) args.push(x.value);
          });
        } else if (option.value) args.push(option.value);
      }

      const message = interaction;

      const context = new CommandContext({
        client: this.client,
        message,
        args,
        author: message.author,
        command
      });

      command.executeCMD(context);
    }

    if (!interaction.isButton()) return;

    const { user, customId, message, guild, channel, member } = interaction;

    const { ticket } =
      await this.client.database.clientUtils.findOne({
        _id: this.client.user.id
      });

    // <----------- Open Ticket ----------->

    const mapTickets = Array.from(ticket.list).map(([, x]) => x);

    const getTicket = mapTickets.find(x => x.channel == channel.id);

    if (customId === 'openTicket') {
      if (!ticket.status)
        return interaction.reply({
          content: `${user}, o sistema de ticket está desativado no momento, tente novamente mais tarde.`,
          ephemeral: true
        });

      const getUser = ticket.list.get(
        mapTickets.find(x => x.user == user.id && x.status)?.id
      );

      if (mapTickets.filter(x => x.user === user.id && x.status).length >= 1)
        return interaction.reply({
          content: `${user}, você já tem um ticket em aberto no servidor. <#${getUser.channel}>`,
          ephemeral: true
        });

      if (listUsers.has(user.id))
        return interaction.reply({
          content: `${user}, você já está com um ticket em aberto!`,
          ephemeral: true
        });

      listUsers.add(user.id);

      const CHANNEL_TYPE = await guild.channels.create(
        `ticket-${user.username}`,
        {
          type: 'GUILD_TEXT',
          permissionOverwrites: [
            {
              id: user.id,
              allow: ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
              deny: ['ADD_REACTIONS', 'SEND_MESSAGES']
            },
            {
              id: guild.id,
              deny: 'VIEW_CHANNEL'
            },
            {
              id: !ticket.staff ? user.id : ticket.staff,
              allow: ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY']
            }
          ]
        }
      );

      interaction.reply({
        content: `${user}, seu ticket foi criado com sucesso! <#${CHANNEL_TYPE.id}>`,
        ephemeral: true
      });

      const ROW_TYPE = new MessageActionRow().addComponents(
        new MessageButton()
          .setStyle('SECONDARY')
          .setCustomId('financeiro')
          .setLabel('Financeiro'),

        new MessageButton()
          .setStyle('SECONDARY')
          .setCustomId('dúvidas')
          .setLabel('Dúvidas')
      );

      const MESSAGES = {
        one: {
          msg: `> Seja bem-vindo(a) ao nosso atendimento! ${user}`,
          time: 100
        },
        two: {
          msg: `\u200b\n> Neste canal você deve concluir os seguintes passos para obter seu atendimento.`,
          time: 2000
        },
        three: {
          msg: `\u200b\n> Escolha qual tipo de ticket você deseja abrir para podermos prosseguir com seu atendimento:`,
          time: 4000
        }
      };

      Object.entries(MESSAGES).map(([, x]) => {
        const { msg, time } = x;

        new setTimeout(async () => {
          if (time >= 4000)
            await CHANNEL_TYPE.send({
              content: msg,
              components: [ROW_TYPE, ROW_TYPE2]
            }).then(async MSG => {
              const filter = interaction => {
                return (
                  interaction.isButton() && interaction.message.id === MSG.id
                );
              };

              const collector = MSG.createMessageComponentCollector({
                filter: filter,
                time: 600000,
                max: 1
              })

                .on('end', async (r, reason) => {
                  listUsers.delete(user.id);
                  collector.stop();

                  if (reason != 'time') return;

                  CHANNEL_TYPE.delete().catch(() => {});
                })

                .on('collect', async r => {
                  if (r.user.id !== user.id)
                    return r.reply({
                      content: `${r.user}, somente quem criou o ticket pode usar os botões.`,
                      ephemeral: true
                    });

                  await r.deferUpdate();

                  await MSG.edit({ components: [] }).catch(() => {});

                  await CHANNEL_TYPE.send({
                    content: `${user}, estou criando seu canal de atendimento, aguarde um instante...`
                  });

                  setTimeout(async () => {
                    CHANNEL_TYPE.delete().catch(() => {});

                    const CHANNEL = await guild.channels.create(
                      `${r.customId
                        .replace('financeiro', '💸・financeiro')
                        .replace('dúvidas', '❔・dúvidas')}-${user.username}`,
                      {
                        type: 'GUILD_TEXT',
                        permissionOverwrites: [
                          {
                            id: user.id,
                            allow: [
                              'VIEW_CHANNEL',
                              'READ_MESSAGE_HISTORY',
                              'SEND_MESSAGES',
                              'ADD_REACTIONS'
                            ]
                          },
                          {
                            id: guild.id,
                            deny: 'VIEW_CHANNEL'
                          },
                          {
                            id: !ticket.staff ? user.id : ticket.staff,
                            allow: ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY']
                          }
                        ]
                      }
                    );

                    const category = guild.channels.cache.get(ticket.category);

                    if (category)
                      await CHANNEL.setParent(ticket.category, {
                        lockPermissions: false
                      });

                    const row = new MessageActionRow().addComponents(
                      new MessageButton()
                        .setStyle('SECONDARY')
                        .setLabel('Arquivar')
                        .setCustomId('archive'),

                      new MessageButton()
                        .setStyle('SECONDARY')
                        .setLabel('Bloquear')
                        .setCustomId('lock/unlock'),

                      new MessageButton()
                        .setStyle('SECONDARY')
                        .setLabel('Fechar Ticket')
                        .setCustomId('close_ticket')
                    );

                    CHANNEL.send({
                      content: `<@${user.id}>`,
                      embeds: [
                        new ClientEmbed(user)
                          .setAuthor({
                            name: `Atendimento - ${user.tag}`,
                            iconURL: user.displayAvatarURL({ dynamic: true })
                          })
                          .setDescription(
                            `> Aqui está seu ticket, neste canal você poderá tirar dúvidas\n> com nossa equipe ou comprar algum produto conosco.`
                          )
                      ],
                      components: [row],
                      fetchReply: true
                    });

                    await this.client.database.clientUtils
                      .findOneAndUpdate(
                        { _id: this.client.user.id },
                        { $set: { 'ticket.list': ticket.list } }
                      )
                  }, 5000);
                });
            });
          else CHANNEL_TYPE.send(msg);
        }, time);
      });

      return;
    }

    // <----------- Lock/Unlock Ticket ----------->

    if (customId === 'lock/unlock') {
      if (getTicket.lastLock > Date.now())
        return interaction.reply({
          content: `${user}, volte **<t:${~~(
            getTicket.lastLock / 1000
          )}:R>** para usar isso novamente..`,
          ephemeral: true
        });

      const status = getTicket.lock;

      const CHANNEL = guild.channels.cache.get(getTicket.channel);

      await CHANNEL.permissionOverwrites.edit(getTicket.user, {
        SEND_MESSAGES: !status ? true : false
      });

      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setStyle('SECONDARY')
          .setLabel('Arquivar')
          .setCustomId('archive'),

        new MessageButton()
          .setStyle('SECONDARY')
          .setLabel(!status ? 'Desbloquear' : 'Bloquear')
          .setCustomId('lock/unlock'),

        new MessageButton()
          .setStyle('SECONDARY')
          .setLabel('Fechar Ticket')
          .setCustomId('close_ticket')
      );

      message.edit({ components: [row], fetchReply: true }).catch(() => {});

      channel.send(
        `${
          !status ? 'Canal bloqueado.' : 'Canal desbloqueado.'
        }`
      );

      await ticket.list.set(`${getTicket.id}`, {
        user: getTicket.user,
        channel: getTicket.channel,
        date: getTicket.date,
        status: getTicket.status,
        archive: getTicket.archive,
        lastTranscript: getTicket.lastTranscript,
        lock: !status ? true : false,
        lastLock: Date.now() + 60000,
        id: getTicket.id
      });

      await this.client.database.clientUtils.findOneAndUpdate(
        { _id: this.client.user.id },
        {
          $set: {
            'ticket.list': ticket.list
          }
        }
      );

      return await interaction.deferUpdate();
    }

    // <----------- Transcript Ticket ----------->

    if (customId === 'transcript') {
      if (getTicket.lastTranscript > Date.now())
        return interaction.reply({
          content: `${user}, você poderá fazer isso de novo **<t:${~~(
            getTicket.lastTranscript / 1000
          )}:R>**.`,
          ephemeral: true
        });

      interaction.reply({
        content: `${user}, estou fazendo o transcript do seu ticket.`,
        ephemeral: true
      });

      return await this.Transcript(getTicket, ticket, user, channel, message);
    }

    // <----------- Archive Ticket ----------->

    if (customId === 'archive') {
      const CHANNEL = guild.channels.cache.get(getTicket.channel);

      await CHANNEL.permissionOverwrites.delete(getTicket.user);

      CHANNEL.setPosition(0);

      await ticket.list.set(`${getTicket.id}`, {
        user: getTicket.user,
        channel: getTicket.channel,
        date: getTicket.date,
        status: false,
        archive: true,
        lastTranscript: getTicket.lastTranscript,
        lock: getTicket.lock,
        lastLock: getTicket.lastLock,
        id: getTicket.id
      });

      await this.client.database.clientUtils
        .findOneAndUpdate(
          { _id: this.client.user.id },
          {
            $set: {
              'ticket.list': ticket.list
            }
          }
        )

      channel.send(`Ticket arquivado com sucesso.`);

      const EMBED = new ClientEmbed(user)
        .setAuthor({
          name: `Ticket Arquivado`,
          iconURL: guild.iconURL({
            dynamic: true
          })
        })
        .setDescription(`Este ticket foi arquivado.`);

      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setStyle('SECONDARY')
          .setLabel('Arquivado')
          .setCustomId('archive')
          .setDisabled(true),

        new MessageButton()
          .setStyle('SECONDARY')
          .setCustomId('close_ticket')
      );

      message
        .edit({ embeds: [EMBED], components: [row], fetchReply: true })
        .catch(() => {});

      return await interaction.deferUpdate();
    }

    // <----------- Close Ticket ----------->

    if (customId === 'close_ticket') {
      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setStyle('SECONDARY')
          .setCustomId('confirm_close'),

        new MessageButton()
          .setStyle('SECONDARY')
          .setCustomId('cancel_close')
      );

      const msg = await interaction.reply({
        content: `${user}, deseja realmente fechar o ticket do usuário?`,
        components: [row],
        fetchReply: true
      });

      const filter = interaction => {
        return interaction.isButton() && interaction.message.id === msg.id;
      };

      msg
        .createMessageComponentCollector({
          filter: filter,
          time: 600000
        })
        .on('end', async (r, reason) => {
          if (reason != 'time') return;

          msg.delete();
        })
        .on('collect', async r => {
          if (r.user.id !== user.id)
            return r.reply({
              content: `${r.user}, somente quem usou o comando pode usar os botões.`,
              ephemeral: true,
              fetchReply: true
            });

          msg.delete();

          switch (r.customId) {
            case 'confirm_close':
              {
                interaction.followUp({
                  content: `${user}, estou fazendo o transcript do seu ticket.`,
                  ephemeral: true,
                  fetchReply: true
                });

                await this.Transcript(
                  getTicket,
                  ticket,
                  user,
                  channel,
                  message
                );

                  await this.closeTicket({
                    hasUser: true,
                    ticket,
                    channel,
                    message,
                    getTicket,
                    guild
                  });
              }
              break;

            case 'cancel_close':
              channel.send(
                `${user}, ação cancelada com sucesso.`
              );
              break;
          }
        });
    }
  }

  async closeTicket({
    ticket,
    channel,
    getTicket,
  }) {
    setTimeout(() => channel.delete(), 5000);

    await ticket.list.set(`${getTicket.id}`, {
      channel: getTicket.channel,
      date: getTicket.date,
      user: getTicket.user,
      status: false,
      id: getTicket.id
    });

    await this.client.database.clientUtils
      .findOneAndUpdate(
        { _id: this.client.user.id },
        { $set: { 'ticket.list': ticket.list } }
      )
  }

  async Transcript(getTicket, ticket, user, channel, message) {
    const amount = 100;

    const pages = Math.ceil(amount / 100);

    const MESSAGES = [];

    let size = 0;

    await ticket.list.set(`${getTicket.id}`, {
      user: getTicket.user,
      channel: getTicket.channel,
      date: getTicket.date,
      msg: getTicket.msg,
      status: getTicket.status,
      archive: getTicket.archive,
      lastTranscript: Date.now() + 600000,
      lock: getTicket.lock,
      lastLock: getTicket.lastLock,
      id: getTicket.id
    });

    await this.client.database.clientUtils.findOneAndUpdate(
      { _id: this.client.user.id },
      {
        $set: {
          'ticket.list': ticket.list
        }
      }
    );

    const getUser = this.client.users.cache.get(getTicket.user);

    const interval = new setInterval(async () => {
      if (size >= pages) {
        const EMBED = new ClientEmbed(user)
          .setAuthor({
            name: `Logs Ticket - ${getUser.tag}`,
            iconURL: getUser.displayAvatarURL({
              dynamic: true
            })
          })
          .setDescription(
            `Fiz transcript de todas as mensagens do ticket com sucesso, use o botão anexado nesta mensagem para ver ir pro link do transcript.`
          )
          .addFields(
            {
              name: `Dono do Ticket`,
              value: `<@${getUser.id}>`
            },
            {
              name: `Transcript feito pelo(a)`,
              value: `<@${user.id}>`
            },
            {
              name: `Feito em`,
              value: `<t:${~~(Date.now() / 1000)}:F>`
            }
          )
          .setThumbnail(
            getUser.displayAvatarURL({
              dynamic: true,
              format: 'png',
              size: 2048
            })
          );

        const archive = await hastebin.createPaste(
          `Transcript do Ticket do(a) Usuário: ${getUser.tag} ( ${getUser.id} )\n\n` +
            MESSAGES.reverse().join('\n\n↢━━━━━━━━━━━━◆━━━━━━━━━━━━━↣\n\n'),
          {
            raw: true,
            contentType: 'text/plain',
            server: 'https://hastebin.com'
          }
        );

        const row = new MessageActionRow().addComponents(
          new MessageButton()
            .setStyle('LINK')
            .setURL(archive)
            .setLabel(`Link do Transcript`)
        );

        const LOGS = this.client.channels.cache.get(ticket.logs);

        channel.send(
          `Fiz o transcript do ticket com sucesso!`
        );

        clearInterval(interval);

        if (LOGS)
          return LOGS.send({
            embeds: [EMBED],
            components: [row],
            fetchReply: true
          });
        else
          message.channel.send({
            embeds: [EMBED],
            components: [row],
            fetchReply: true
          });
      } else {
        let messages = await channel.messages.fetch({
          limit: size === pages.length - 1 ? amount - (pages - 1) * 100 : 100
        });

        messages = messages.map(x => x).filter(m => !m.author.bot);

        if (!messages.length) {
          MESSAGES.push(`Nenhuma mensagem.`);
          return size++;
        }

        for (let value of messages) {
          const { author, attachments, content, createdTimestamp } = value;

          MESSAGES.push(
            `👤 Autor: ${author.username}#${author.discriminator} ( ${
              value.author.id
            } )\n${
              attachments.size >= 1 && content
                ? `📎 Imagens: ${attachments
                    .map(x => x.url)
                    .join(' || ')}\n✉️ Mensagem: ${content.replace(
                    /(\*|~+|`)/g,
                    ''
                  )}`
                : attachments.size >= 1
                ? attachments.map(x => x.url).join(' || ')
                : `✉️ Mensagem: ${content.replace(/(\*|~+|`)/g, '')}`
            }\n📆 Data: ${this.client.msToHour(createdTimestamp - 1.08e7)}`
          );
        }

        size++;
      }
    }, 1500);
  }
};