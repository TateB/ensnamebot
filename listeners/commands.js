import { userMention } from "@discordjs/builders"
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

      interaction.reply("Normalised value: `" + normalised + "`")
      break
    }
    case "refresh": {
      interaction.deferReply({ ephemeral: true })
      refreshPermissions().then(() =>
        interaction.followUp("Refreshed slash command permissions!")
      )
      break
    }
    case "bulkban": {
      console.log("received bulkban", interaction.options.getBoolean("confirm"))
      const starttime = interaction.options.get("starttime").value
      const endtime = interaction.options.get("endtime").value
      const confirm = interaction.options.getBoolean("confirm")
      const banEmbed = new MessageEmbed().setTitle(
        confirm ? `Banned Users` : `Going to Ban Users`
      )
      var count = 0
      var exampleUser

      interaction.deferReply()

      interaction.guild.members
        .fetch({ force: true })
        .then((allMembers) => {
          const bannableMembers = allMembers
            .filter(
              (member) =>
                member.joinedTimestamp >= starttime &&
                member.joinedTimestamp <= endtime
            )
            .sorted(
              (memberA, memberB) =>
                memberA.joinedTimestamp - memberB.joinedTimestamp
            )
          const firstUser = bannableMembers.first()
          const lastUser = bannableMembers.at(bannableMembers.size - 1)
          console.log(
            bannableMembers.size,
            firstUser.displayName,
            lastUser.displayName
          )

          banEmbed.addFields(
            { name: "User Amount", value: `${bannableMembers.size}` },
            {
              name: "First User",
              value: `${userMention(firstUser.id)}`,
              inline: true,
            },
            {
              name: "Last User",
              value: `${userMention(lastUser.id)}`,
              inline: true,
            }
          )

          return confirm
            ? Promise.all(
                bannableMembers.map((member) =>
                  member.ban({ reason: "bulk ban" })
                )
              )
            : null
        })
        .then(() => interaction.editReply({ embeds: [banEmbed] }))
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
