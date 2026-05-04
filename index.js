require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Events,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

const staffRoles = [
  { name: "🔒 > • 👑 OWNER/FUNDADOR", id: "1496029474846806176" },
  { name: "> • 👾 CEO", id: "1496029476231053363" },
  { name: "> • 👀 CO-CEO", id: "1496029477027971112" },
  { name: "> • RESPONSAVEL GERAL", id: "1496123385380470894" },
  { name: "> • RESPONSAVEL STAFF", id: "1496125131519430666" },
  { name: "> • RESPONSAVEL TICKET", id: "1496123378220929094" },
  { name: "> • ADMIN GERAL", id: "1496123388991770734" },
  { name: "> • ADMIN", id: "1496122044671070338" },
  { name: "> • EQUIPE TICKET", id: "1496029487333249105" },
  { name: "> > • EQUIPE DENÚNCIA", id: "1496120303938437140" },
  { name: "> • MODERADOR", id: "1496029484162220173" },
  { name: "> • EQUIPE SUPORTE", id: "1496029485626294394" },
  { name: "> • EQUIPE ALOWLIST", id: "1496122051092680784" },
];

function agoraFormatado() {
  return new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function gerarEmbeds(guild) {
  const embeds = [];

  for (const roleInfo of staffRoles) {
    const role = guild.roles.cache.get(roleInfo.id);
    if (!role) continue;

    const membros = role.members
      .map(member => `• ${member}`)
      .join("\n");

    const quantidade = role.members.size;

    const embed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setTitle(`${roleInfo.name} - [${quantidade}] membros`)
      .setDescription(`${role}\n\n${membros || "Nenhum membro neste cargo."}`)
      .setFooter({
        text: `Atualizado Automaticamente | Última alteração: ${agoraFormatado()}`
      });

    embeds.push(embed);
  }

  return embeds;
}

async function atualizarHierarquia() {
  try {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return console.log("Servidor não encontrado.");

    const channel = await guild.channels.fetch(process.env.CHANNEL_ID);
    const embeds = gerarEmbeds(guild);

    const embedsLimitados = embeds.slice(0, 10);

    if (process.env.MESSAGE_ID) {
      const msg = await channel.messages.fetch(process.env.MESSAGE_ID);
      await msg.edit({ embeds: embedsLimitados });
    } else {
      const novaMensagem = await channel.send({ embeds: embedsLimitados });
      console.log("Coloque este MESSAGE_ID no .env:");
      console.log(novaMensagem.id);
    }
  } catch (err) {
    console.log("Erro ao atualizar hierarquia:", err.message);
  }
}

let timeoutAtualizacao = null;

function agendarAtualizacao() {
  clearTimeout(timeoutAtualizacao);

  timeoutAtualizacao = setTimeout(() => {
    atualizarHierarquia();
  }, 5000);
}

client.once(Events.ClientReady, async () => {
  console.log(`Bot online como ${client.user.tag}`);
  agendarAtualizacao();
});

client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
  const cargosAntigos = oldMember.roles.cache.map(r => r.id).sort().join(",");
  const cargosNovos = newMember.roles.cache.map(r => r.id).sort().join(",");

  if (cargosAntigos !== cargosNovos) {
    agendarAtualizacao();
  }
});

client.on("error", err => {
  console.log("Erro do client:", err.message);
});

client.login(process.env.TOKEN);