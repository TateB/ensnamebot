import { SlashCommandBuilder } from "@discordjs/builders"
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import { readFileSync } from "fs"
const { guildId, clientId, token } = JSON.parse(readFileSync("./config.json"))

const commands = [
  new SlashCommandBuilder()
    .setName("global")
    .setDescription("Global settings")
    .setDefaultPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a global check")
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
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a global check")
        .addIntegerOption((option) =>
          option
            .setName("index")
            .setDescription(
              "Index of global check (if you don't know, use list)"
            )
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("Lists global checks")
        .addIntegerOption((option) =>
          option
            .setName("page")
            .setDescription("Page of list")
            .setRequired(false)
        )
    ),
  new SlashCommandBuilder()
    .setName("user")
    .setDescription("User settings")
    .setDefaultPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Set a user check")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to set check")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("expression")
            .setDescription("Expression string (regex)")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a user from checks")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to remove from checks")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a user to checks")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to add to checks")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("Lists user checks")
        .addIntegerOption((option) =>
          option
            .setName("page")
            .setDescription("Page of list")
            .setRequired(false)
        )
    ),
  new SlashCommandBuilder()
    .setName("emulate")
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
  new SlashCommandBuilder()
    .setName("refresh")
    .setDescription("Refresh the slash command permissions")
    .setDefaultPermission(false),
  new SlashCommandBuilder()
    .setName("bulkban")
    .setDescription("Bulk ban users who joined between certain times")
    .setDefaultPermission(false)
    .addSubcommand((command) =>
      command
        .setName("users")
        .setDescription("Use users to calculate bulk ban")
        .addUserOption((option) =>
          option
            .setName("startuser")
            .setDescription("Starting user for bulk ban")
            .setRequired(true)
        )
        .addUserOption((option) =>
          option
            .setName("enduser")
            .setDescription("Ending user for bulk ban")
            .setRequired(true)
        )
    )
    .addSubcommand((command) =>
      command
        .setName("times")
        .setDescription("Use times to calculate bulk ban")
        .addIntegerOption((option) =>
          option
            .setName("starttime")
            .setDescription(
              "Start time for bulk ban search (EPOCH milliseconds)"
            )
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("endtime")
            .setDescription("End time for bulk ban search (EPOCH milliseconds)")
            .setRequired(true)
        )
    ),
  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Clears/cancels all existing ban prompts")
    .setDefaultPermission(false),
].map((command) => command.toJSON())

const rest = new REST({ version: "9" }).setToken(token)

rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error)
