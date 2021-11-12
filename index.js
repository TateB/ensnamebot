const { Client, Intents } = require("discord.js");
const { token, important_users } = require("./config.json");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS],
});

client.once("ready", () => {
  console.log("bot ready");
});

client.on("guildMemberAdd", (member) => {
  const { displayName, id } = member;

  // wildcard collab.land check
  if (
    displayName.split(" ")[0].toLowerCase() === "collab.land" &&
    id != "704521096837464076"
  ) {
    member.ban({ days: 0, reason: "username variant match for collab.land" });
  }

  important_users.forEach((importantUser) => {
    importantUser.variants.forEach((variant) => {
      if (variant === displayName && id !== importantUser.id) {
        member.ban({
          days: 0,
          reason: `username variant match for ${importantUser.variants[0]}`,
        });
      }
    });
  });
});

client.login(token);
