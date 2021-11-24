import { userMention } from "@discordjs/builders"
import { MessageEmbed } from "discord.js"
import { confirmations, db } from "../index.js"
import { createLogEntryWithTimeout } from "../util/logCreator.js"

export const name = "autoban"

export async function execute(
  interaction,
  confirmation,
  confirmationIndex,
  type
) {
  const newLogEmbed = new MessageEmbed().setColor("#52e5ff")
  var userUnbanned = false

  // if type isn't revert, type is unknown so throw error
  if (type !== "revert") return new Error(`Invalid type: ${type}`)

  // if confirmation type is an emulation, don't actually run ban action, just set userUnbanned true
  if (confirmation.type !== "request-emu") {
    // if unban is successful, set userUnbanned to true, otherwise log error
    interaction.guild.members
      .unban(confirmation.member.id || confirmation.member.userId)
      .then(() => (userUnbanned = true))
      .catch((err) => {
        console.error(err)
      })
  } else {
    userUnbanned = true
  }

  // if userUnbanned is true, send success message, otherwise send error message
  if (userUnbanned) {
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
  } else {
    newLogEmbed
      .setTitle("User Already Unbanned")
      .setDescription("Action failed because user is already unbanned.")
      .setFields({
        name: "Unbanned User",
        value: confirmation.member.displayName,
      })
      .setFields(
        {
          name: "Unbanned User",
          value: confirmation.member.displayName,
        },
        {
          name: "Initiated By",
          value: userMention(interaction.member.id),
        }
      )
  }

  confirmations.splice(confirmationIndex, 1)
  db.write()
  return createLogEntryWithTimeout(newLogEmbed, interaction)
}
