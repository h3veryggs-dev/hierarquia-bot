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
  { name: "> • RESPONSÁVEL TICKET", id: "1496123378220929094" },
  { name: "> • EQUIPE COORDENADOR", id: "1500951995870216353" },
  { name: "> • EQUIPE SUPERVISOR", id: "1500951982213566465" },
  { name: "> • ADMIN GERAL", id: "1496123388991770734" },
  { name: "> • ADMIN", id: "1496122044671070338" },
  { name: "> • DIRETOR", id: "1500952889936580608" },
  { name: "> • EQUIPE TICKET", id: "1496029487333249105" },
  { name: "> • MODERADOR", id: "1496029484162220173" },
  { name: "> • EQUIPE SUPORTE", id: "1496029485626294394" },
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

async function carregarMembros(guild) {
  try {
    await guild.members.fetch();
  } catch (err) {
    const retry = err?.data?.retry_after;
    if (retry) {
      await new Promise(r => setTimeout(r, retry * 1000));
      await guild.members.fetch();
    }
  }
}

async function atualizarHierarquia() {
  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  const channel = await guild.channels.fetch(process.env.CHANNEL_ID);

  if (!channel || !channel.isTextBased()) {
    console.log("Canal inválido.");
    return;
  }

  await carregarMembros(guild);

  const membrosJaListados = new Set();

  for (const roleInfo of staffRoles) {
    const role = guild.roles.cache.get(roleInfo.id);
    if (!role) continue;

    const membrosFiltrados = role.members.filter(member => {
      if (membrosJaListados.has(member.id)) return false;
      membrosJaListados.add(member.id);
      return true;
    });

    const membros = membrosFiltrados.map(m => `• ${m}`).join("\n");
    const quantidade = membrosFiltrados.size;

    const embed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setTitle(`${roleInfo.name} - [${quantidade}] membros${"‎".repeat(40)}`)
      .setDescription(
        `${role}\n\n${membros || "• Nenhum membro neste cargo."}`
      )
      .setFooter({
        text: `Atualizado Automaticamente | ${agoraFormatado()}`
      });

    const key = `MSG_${roleInfo.id}`;

    if (process.env[key]) {
      try {
        const msg = await channel.messages.fetch(process.env[key]);
        await msg.edit({ embeds: [embed] });
      } catch {
        await channel.send({ embeds: [embed] });
      }
    } else {
      // só cria, sem spam
      await channel.send({ embeds: [embed] });
    }
  }
}

let timeout = null;

function agendarAtualizacao() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    atualizarHierarquia();
  }, 5000);
}

client.once(Events.ClientReady, () => {
  console.log(`Bot online como ${client.user.tag}`);
  agendarAtualizacao();
});

client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
  const antes = oldMember.roles.cache.map(r => r.id).join(",");
  const depois = newMember.roles.cache.map(r => r.id).join(",");

  if (antes !== depois) {
    agendarAtualizacao();
  }
});

client.on("error", err => {
  console.log("Erro:", err.message);
});

client.login(process.env.TOKEN);