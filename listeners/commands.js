import { MessageEmbed } from "discord.js"
import unhomoglyph from "unhomoglyph"
import { refreshPermissions, submitBan } from "../index.js"
import { globalHandler } from "./commands/global.js"
import { userHandler } from "./commands/user.js"

// Interaction listener for commands
export async function commandListener(interaction) {
  const commandEmbed = new MessageEmbed().setColor("#52e5ff")

  // switch between commands, and hand off to command handlers for global/user
  switch (interaction.commandName) {
    case "global": {
      globalHandler(interaction, commandEmbed)
      break
    }
    case "user": {
      userHandler(interaction, commandEmbed)
      break
    }
    case "emulate": {
      const user = interaction.options.getUser("user")
      const type = interaction.options.get("type").value
      const reason = interaction.options.get("reason").value

      submitBan(
        interaction.guild.members.cache.get(user.id),
        reason,
        "emulation",
        type === "autoban" ? false : true
      )
      interaction.reply("Emulating ban...")
      break
    }
    case "normalise": {
      const value = interaction.options.get("value").value
      const normalised = unhomoglyph(value)

      interaction.reply("Normalised value: " + normalised)
      break
    }
    case "refresh": {
      interaction.deferReply({ ephemeral: true })
      refreshPermissions().then(() =>
        interaction.followUp("Refreshed slash command permissions!")
      )
      break
    }
    default: {
      interaction.reply({
        content: "There was an error processing your command.",
        ephemeral: true,
      })
      break
    }
  }
}
