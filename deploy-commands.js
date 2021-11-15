import { SlashCommandBuilder } from "@discordjs/builders"
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import { readFileSync } from "fs"
const { guildId, clientId, token } = JSON.parse(readFileSync("./config.json"))

const commands = [
  new SlashCommandBuilder()
    .setName("addglobalcheck")
    .setDescription("Adds a global check expression.")
    .setDefaultPermission(false)
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Type of expression")
        .addChoices([
          ["Regex", "regex"],
          ["Exact", "exact"],
          ["Contains", "contains"],
        ])
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("expression")
        .setDescription("Expression string")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("setusercheck")
    .setDescription("Sets the check for a username (regex)")
    .setDefaultPermission(false)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to set check")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("expression")
        .setDescription(
          "Expression string (regex), if left blank it will create one for you"
        )
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("emulateban")
    .setDescription("Emulate an autoban or ban request")
    .setDefaultPermission(false)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to emulate ban for")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Ban type")
        .addChoices([
          ["Autoban", "autoban"],
          ["Ban Request", "request"],
        ])
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for ban")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("normalise")
    .setDescription("Normalise/unhomoglyph a name")
    .setDefaultPermission(false)
    .addStringOption((option) =>
      option
        .setName("value")
        .setDescription("Value to normalise")
        .setRequired(true)
    ),
].map((command) => command.toJSON())

const rest = new REST({ version: "9" }).setToken(token)

rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error)
