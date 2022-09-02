const { Client, Collection, Message } = require('discord.js');
const klaw = require('klaw');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(require('fs').readdir);

module.exports = class Bot extends Client {
  constructor() {
    super({
      intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES', 'GUILD_PRESENCES'],
      partials: ['MESSAGE', 'CHANNEL'],
      allowedMentions: { parse: ['users'], repliedUser: true },
      failIfNotExists: false
    });

    this.commands = new Collection();
    this.subcommands = new Collection();

    this.aliases = new Collection();
    this.database = new Collection();

    this.cooldowns = new Map();
  }

  shorten(text, len) {
    if (typeof text !== 'string') return '';
    if (text.length <= len) return text;
    return text.substr(0, len).trim() + '...';
  }

  msToHour(time) {
    time = Math.round(time / 1000);
    const s = time % 60,
      m = ~~((time / 60) % 60),
      h = ~~(time / 60 / 60);

    return h === 0
      ? `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(Math.abs(h) % 24).padStart(2, '0')}:${String(m).padStart(
          2,
          '0'
        )}:${String(s).padStart(2, '0')}`;
  }

  async findUser(args, message = Message) {
    let user = message.author;

    if (!args || !message) return (user = message.author);

    if (/<@!?\d{17,18}>/.test(args))
      user = await message.client.users.fetch(args.match(/\d{17,18}/)?.[0]);
    else {
      try {
        user = await message.guild.members
          .search({ query: args, limit: 1, cache: false })
          .then(x => x.first().user);
      } catch {}
      try {
        user = await message.client.users.fetch(args).catch(null);
      } catch {}
    }
    if (user) return user;
  }

  load(commandPath, commandName) {
    const props = new (require(`${commandPath}/${commandName}`))(this);
    if (props.subcommand) {
      if (!this.subcommands.get(props.reference)) {
        this.subcommands.set(props.reference, new Collection());
      }
      this.subcommands.get(props.reference).set(props.name, props);
    }
    if (props.subcommand) return;
    props.location = commandPath;

    if (props.init) {
      props.init(this);
    }

    this.commands.set(props.name, props);
    props.aliases.forEach(aliases => {
      this.aliases.set(aliases, props.name);
    });
    return false;
  }

  login() {
    super.login(process.env.TOKEN);
  }

  async onLoad() {
    this.login();

    klaw('src/commands').on('data', item => {
      const cmdFile = path.parse(item.path);
      if (!cmdFile.ext || cmdFile.ext !== '.js') return;
      const response = this.load(cmdFile.dir, `${cmdFile.name}${cmdFile.ext}`);
      if (response) return;
    });

    const eventFiles = await readdir(`./src/functions/`);
    eventFiles.forEach(file => {
      const eventName = file.split('.')[0];
      const event = new (require(`./functions/${file}`))(this);
      this.on(eventName, (...args) => event.run(...args));
      delete require.cache[require.resolve(`./functions/${file}`)];
    });
  }
};

const dbIndex = require('./database/index.js');
dbIndex.start();