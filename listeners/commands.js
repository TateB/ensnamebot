import { userMention } from "@discordjs/builders"
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js"
import unhomoglyph from "unhomoglyph"
import { globalHandler } from "../commands/global.js"
import { userHandler } from "../commands/user.js"
import { confirmations, db, guildPromptRef } from "../index.js"
import { refreshPermissions } from "../util/refreshPermissions.js"
import { submitBan } from "../util/submitBan.js"

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
    case "clear": {
      const confirmsToClear = confirmations.filter((x) => x.type === "request")
      return interaction
        .deferReply({ ephemeral: true })
        .then(() =>
          Promise.all(
            confirmsToClear.map((confirm) => {
              const index = confirmations.findIndex((x) => x === confirm)
              confirmations.splice(index, 1)
              return guildPromptRef.messages
                .fetch(confirm.id)
                .then((msg) => msg.delete())
                .catch(console.error)
            })
          )
        )
        .then(() => db.write())
        .then(() => interaction.editReply("Cleared all prompts!"))
    }
    case "bulkban": {
      const type = interaction.options.getSubcommand()
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

          // if times are in wrong order, swap them
          if (startTime > endTime)
            endTime = [startTime, (startTime = endTime)][0]
        })
        .then(() => interaction.guild.members.fetch({ force: true }))
        .then((allMembers) =>
          allMembers
            .filter(
              (member) =>
                member.joinedTimestamp >= startTime &&
                member.joinedTimestamp <= endTime
            )
            .sorted(
              (memberA, memberB) =>
                memberA.joinedTimestamp - memberB.joinedTimestamp
            )
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
                    value: `${userMention(bannableMembers.first().id)}`,
                    inline: true,
                  },
                  {
                    name: "Last User",
                    value: `${userMention(bannableMembers.last().id)}`,
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
        .then(() => db.write())
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
