import { userMention } from "@discordjs/builders"
import { MessageEmbed } from "discord.js"
import { bulkBan } from "../buttons/bulkBan.js"
import { confirmations, db } from "../index.js"
import { createLogEntryWithTimeout } from "../util/logCreator.js"

export async function buttonListener(interaction) {
  const confirmationIndex = confirmations.findIndex(
    (x) => x.id === interaction.message.id
  )

  // if confirmation couldn't be found, return as the reaction isn't relevant
  if (confirmationIndex === -1) return

  const confirmation = confirmations[confirmationIndex]
  const hasBanPermissions = interaction.guild.members.cache
    .get(interaction.user.id)
    .permissions.has("BAN_MEMBERS")

  // user needs ban permissions as buttons can ban
  if (!hasBanPermissions) return

  // if bulk ban, pass to different handler
  if (
    interaction.customId === "ban-bulk" ||
    interaction.customId === "cancel-bulk"
  )
    return bulkBan(interaction, confirmation, confirmationIndex)

  const newLogEmbed = new MessageEmbed().setColor("#52e5ff")

  // bad code because i can't figure out why the member record is switching between two data structures
  const targetMember =
    interaction.customId !== "revert"
      ? await interaction.guild.members
          .fetch({
            user: confirmation.member.id || confirmation.member.userId,
            force: true,
          })
          .catch(console.error)
      : undefined

  // targetMember will be undefined if user is banned, make sure error isn't thrown and inform user
  if (
    targetMember === undefined &&
    (interaction.customId === "ban" || interaction.customId === "cancel")
  ) {
    newLogEmbed
      .setTitle("User Already Banned")
      .setDescription("Action failed because user is already banned.")
      .setFields({
        name: "Banned User",
        value: confirmation.member.displayName,
      })
      .setFields(
        {
          name: "Banned User",
          value: confirmation.member.displayName,
        },
        {
          name: "Initiated By",
          value: userMention(interaction.member.id),
        }
      )
    confirmations.splice(confirmationIndex, 1)
    db.write()
    createLogEntryWithTimeout(newLogEmbed, interaction)
    return
  }

  // match to button id, then create message and commit action
  switch (interaction.customId) {
    case "ban": {
      newLogEmbed.setTitle("Ban Request Finalised").addFields(
        {
          name: "User",
          value: userMention(targetMember.id),
          inline: true,
        },
        {
          name: "Confirmed By",
          value: userMention(interaction.user.id),
          inline: true,
        }
      )
      if (confirmation.type !== "request-emu")
        targetMember.ban().catch(console.error)
      confirmations.splice(confirmationIndex, 1)
      db.write()
      createLogEntryWithTimeout(newLogEmbed, interaction)
      break
    }
    case "cancel": {
      newLogEmbed.setTitle("Ban Request Cancelled").addFields(
        {
          name: "User",
          value: userMention(targetMember.id),
          inline: true,
        },
        {
          name: "Cancelled By",
          value: userMention(interaction.user.id),
          inline: true,
        }
      )
      confirmations.splice(confirmationIndex, 1)
      db.write()
      createLogEntryWithTimeout(newLogEmbed, interaction)
      break
    }
    case "revert": {
      newLogEmbed.setTitle("Autoban Removed").addFields(
        {
          name: "User",
          value: userMention(
            confirmation.member.id || confirmation.member.userId
          ),
          inline: true,
        },
        {
          name: "Removed By",
          value: userMention(interaction.user.id),
          inline: true,
        }
      )
      if (confirmation.type !== "request-emu")
        interaction.guild.members
          .unban(confirmation.member.id || confirmation.member.userId)
          .catch(console.error)
      confirmations.splice(confirmationIndex, 1)
      db.write()
      createLogEntryWithTimeout(newLogEmbed, interaction)
      break
    }
    default: {
      break
    }
  }
}
