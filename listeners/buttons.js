import { userMention } from "@discordjs/builders"
import { MessageEmbed } from "discord.js"
import { confirmations, db } from ".."

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
    confirmations.splice(confirmationIndex, 1)
    interaction.update({ embeds: [newLogEmbed], components: [] })
    db.write()
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
      targetMember.ban().catch(console.error)
      confirmations.splice(confirmationIndex, 1)
      interaction.update({ embeds: [newLogEmbed], components: [] })
      db.write()
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
      interaction.update({ embeds: [newLogEmbed], components: [] })
      db.write()
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
      interaction.guild.members
        .unban(confirmation.member.id || confirmation.member.userId)
        .catch(console.error)
      confirmations.splice(confirmationIndex, 1)
      interaction.update({ embeds: [newLogEmbed], components: [] })
      db.write()
      break
    }
    default: {
      break
    }
  }
}
