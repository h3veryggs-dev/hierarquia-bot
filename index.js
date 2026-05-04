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

// 🔥 carrega membros com retry (corrige erro do Railway)
async function carregarMembros(guild) {
  try {
    await guild.members.fetch();
  } catch (err) {
    const retry = err?.data?.retry_after;

    if (retry) {
      console.log(`Rate limit. Tentando de novo em ${retry}s...`);
      await new Promise(r => setTimeout(r, retry * 1000));
      await guild.members.fetch();
    } else {
      console.log("Erro ao carregar membros:", err.message);
    }
  }
}

async function gerarEmbeds(guild) {
  await carregarMembros(guild);

  const embeds = [];
  const membrosJaListados = new Set();

  for (const roleInfo of staffRoles) {
    const role = guild.roles.cache.get(roleInfo.id);
    if (!role) continue;

    const membrosDoCargo = role.members.filter(member => {
      if (membrosJaListados.has(member.id)) return false;

      membrosJaListados.add(member.id);
      return true;
    });

    const membros = membrosDoCargo
      .map(member => `• ${member}`)
      .join("\n");

    const quantidade = membrosDoCargo.size;

    embeds.push(
      new EmbedBuilder()
        .setColor("#2b2d31")
        .setTitle(`${roleInfo.name} - [${quantidade}] membros`)
        .setDescription(`${role}\n\n${membros || "Nenhum membro neste cargo."}`)
        .setFooter({
          text: `Atualizado Automaticamente | Última alteração: ${agoraFormatado()}`
        })
    );
  }

  return embeds;
}

async function atualizarHierarquia() {
  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const channel = await guild.channels.fetch(process.env.CHANNEL_ID);

    const embeds = await gerarEmbeds(guild);

    const embedsLimitados = embeds.slice(0, 10);

    if (process.env.MESSAGE_ID) {
      const msg = await channel.messages.fetch(process.env.MESSAGE_ID);
      await msg.edit({ embeds: embedsLimitados });
    } else {
      const nova = await channel.send({ embeds: embedsLimitados });
      console.log("Coloque este MESSAGE_ID no Railway:");
      console.log(nova.id);
    }
  } catch (err) {
    console.log("Erro ao atualizar:", err.message);
  }
}

// ⏳ evita spam de atualização
let timeout = null;

function agendarAtualizacao() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    atualizarHierarquia();
  }, 5000);
}

// ✅ evento correto
client.once(Events.ClientReady, () => {
  console.log(`Bot online como ${client.user.tag}`);
  agendarAtualizacao();
});

// 🔄 detecta mudança de cargo
client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
  const antes = oldMember.roles.cache.map(r => r.id).join(",");
  const depois = newMember.roles.cache.map(r => r.id).join(",");

  if (antes !== depois) {
    agendarAtualizacao();
  }
});

client.on("error", err => {
  console.log("Erro do bot:", err.message);
});

client.login(process.env.TOKEN);