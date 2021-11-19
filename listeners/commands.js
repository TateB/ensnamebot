import { userMention } from "@discordjs/builders"
import { MessageActionRow, MessageEmbed } from "discord.js"
import unhomoglyph from "unhomoglyph"
import { confirmations, refreshPermissions, submitBan } from "../index.js"
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
      const type = interaction.options.get("type").value
      var startTime
      var endTime

      interaction
        .deferReply()
        .then(() => {
          if (type === "users") {
            startTime =
              interaction.options.getMember("startuser").joinedTimestamp
            endTime = interaction.options.getMember("enduser").joinedTimestamp
          } else {
            startTime = interaction.options.getInteger("starttime")
            endTime = interaction.options.getInteger("endtime")
          }
        })
        .then(() => interaction.guild.members.fetch({ force: true }))
        .then(
          (allMembers) =>
            (bannableMembers = allMembers
              .filter(
                (member) =>
                  member.joinedTimestamp >= startTime &&
                  member.joinedTimestamp <= endTime
              )
              .sorted(
                (memberA, memberB) =>
                  memberA.joinedTimestamp - memberB.joinedTimestamp
              ))
        )
        .then((bannableMembers) =>
          interaction.editReply({
            embeds: [
              new MessageEmbed()
                .setTitle("Confirm Bulk Ban")
                .setColor("RED")
                .setDescription(
                  `WARNING!!! CONFIRMING THIS WILL BAN ${bannableMembers.size} USERS!!!`
                )
                .addFields(
                  { name: "User Amount", value: `${bannableMembers.size}` },
                  {
                    name: "First User",
                    value: `${userMention(bannableMembers.first())}`,
                    inline: true,
                  },
                  {
                    name: "Last User",
                    value: `${userMention(bannableMembers.last())}`,
                    inline: true,
                  }
                ),
            ],
            components: [
              new MessageActionRow().addComponents(
                new MessageButton()
                  .setCustomId("ban-bulk")
                  .setLabel("Ban All")
                  .setStyle("DANGER"),
                new MessageButton()
                  .setCustomId("cancel-bulk")
                  .setLabel("Cancel")
                  .setStyle("SUCCESS")
              ),
            ],
          })
        )
        .then((message) =>
          confirmations.push({
            id: message.id,
            type: "request-bulk",
            times: {
              startTime,
              endTime,
            },
          })
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
