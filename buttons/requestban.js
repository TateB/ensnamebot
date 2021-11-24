import { userMention } from "@discordjs/builders"
import { MessageEmbed } from "discord.js"
import { confirmations, db, ignoredUsers } from "../index.js"
import { createLogEntryWithTimeout } from "../util/logCreator.js"
import { logToConsole } from "../util/logToConsole.js"

export const name = "requestban"

export async function execute(
  interaction,
  confirmation,
  confirmationIndex,
  type
) {
  const newLogEmbed = new MessageEmbed().setColor("#52e5ff")

  // bad code because i can't figure out why the member record is switching between two data structures
  const targetMember = await interaction.guild.members
    .fetch({
      user: confirmation.member.id || confirmation.member.userId,
      force: true,
    })
    .catch((err) =>
      logToConsole("requestban", `Failed to fetch user - ${err.message}`, true)
    )

  // if the member couldn't be found, inform user and return
  if (!targetMember) {
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
    return createLogEntryWithTimeout(newLogEmbed, interaction)
  }

  // switch for type of button
  switch (type) {
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
      // if ban is emulation, don't actually ban. otherwise ban user
      if (confirmation.type !== "request-emu")
        targetMember
          .ban()
          .catch((err) =>
            logToConsole(
              "requestban",
              `Failed to ban user - ${err.message}`,
              true
            )
          )
      confirmations.splice(confirmationIndex, 1)
      db.write()
      return createLogEntryWithTimeout(newLogEmbed, interaction)
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
      // remove confirmation from array since user cancelled request
      confirmations.splice(confirmationIndex, 1)
      db.write()
      return createLogEntryWithTimeout(newLogEmbed, interaction)
    }
    case "ignore": {
      newLogEmbed.setTitle("User Ignored").addFields(
        {
          name: "User",
          value: userMention(
            confirmation.member.id || confirmation.member.userId
          ),
          inline: true,
        },
        {
          name: "Ignored By",
          value: userMention(interaction.user.id),
          inline: true,
        }
      )
      // add new user to ignoredUsers array so there are no requests for them in the future
      ignoredUsers.push(confirmation.member.id || confirmation.member.userId)
      db.write()
      return createLogEntryWithTimeout(newLogEmbed, interaction)
    }
    default: {
      return new Error(`Invalid type: ${type}`)
    }
  }
}
