require("dotenv").config();

const fs = require("fs");

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

const DB_FILE = "./messages.json";

function carregarDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function salvarDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

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
      console.log(`Rate limit, esperando ${retry}s...`);
      await new Promise(r => setTimeout(r, retry * 1000));
      await guild.members.fetch();
    } else {
      console.log("Erro ao carregar membros:", err.message);
    }
  }
}

async function atualizarHierarquia() {
  try {
    const db = carregarDB();

    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const channel = await guild.channels.fetch(process.env.CHANNEL_ID);

    if (!channel || !channel.isTextBased()) {
      console.log("CHANNEL_ID inválido. Use um canal de texto.");
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
        .setDescription(`${role}\n\n${membros || "• Nenhum membro neste cargo."}`)
        .setFooter({
          text: `Atualizado Automaticamente | ${agoraFormatado()}`
        });

      const key = roleInfo.id;
      const savedMessageId = db[key];

      if (savedMessageId) {
        try {
          const msg = await channel.messages.fetch(savedMessageId);
          await msg.edit({ embeds: [embed] });
          continue;
        } catch {
          console.log(`Mensagem antiga de ${roleInfo.name} não encontrada. Criando outra...`);
        }
      }

      const nova = await channel.send({ embeds: [embed] });
      db[key] = nova.id;
      salvarDB(db);
      console.log(`Mensagem salva para ${roleInfo.name}: ${nova.id}`);
    }
  } catch (err) {
    console.log("Erro ao atualizar hierarquia:", err.message);
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
  const antes = oldMember.roles.cache.map(r => r.id).sort().join(",");
  const depois = newMember.roles.cache.map(r => r.id).sort().join(",");

  if (antes !== depois) {
    agendarAtualizacao();
  }
});

client.on("error", err => {
  console.log("Erro:", err.message);
});

client.login(process.env.TOKEN);