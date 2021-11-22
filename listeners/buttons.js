import { userMention } from "@discordjs/builders"
import { MessageEmbed } from "discord.js"
import { confirmations, db, guildLogRef } from "../index.js"

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
      if (confirmation.type !== "request-emu")
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
      if (confirmation.type !== "request-emu")
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

// bulk ban function for banning users between specific timestamps.
async function bulkBan(interaction, confirmation, confirmationIndex) {
  if (interaction.customId === "cancel-bulk") {
    const newLogEmbed = new MessageEmbed()
      .setColor("#52e5ff")
      .setTitle("Bulk Ban Cancelled")

    confirmations.splice(confirmationIndex, 1)
    interaction.update({ embeds: [newLogEmbed], components: [] })
    db.write()
    return
  }

  const newLogEmbed = new MessageEmbed()
    .setColor("#52e5ff")
    .setTitle("Banning Members...")
  // date for calculating estimated time
  const startedAt = Date.now()
  var bannedNum = 0
  var totalBans = 0
  var percent = 0
  var erroredUsers = 0

  // defer update because it might take a while before the first message comes through
  interaction
    .update({
      embeds: [new MessageEmbed().setTitle("Starting bulk ban...")],
      components: [],
    })
    .then(() => interaction.guild.members.fetch({ force: true }))
    .then(
      // filter down members to only those between the joined timestamps, and sort the array by joined timestamp
      (allMembers) =>
        allMembers
          .filter(
            (member) =>
              member.joinedTimestamp >= confirmation.times.startTime &&
              member.joinedTimestamp <= confirmation.times.endTime
          )
          .sorted(
            (memberA, memberB) =>
              memberA.joinedTimestamp - memberB.joinedTimestamp
          )
    )
    .then((bannedMembers) => {
      // send the first percent update at 0
      totalBans = bannedMembers.size
      sendPercentUpdate()
      return bannedMembers
    })
    .then((bannedMembers) =>
      Promise.all(
        bannedMembers.map((member) =>
          // ban each member, and call the updateProgress event
          member
            .ban({ reason: "bulk ban" })
            .then(updateProgress)
            .catch(() => erroredUsers + 1)
        )
      )
    )
    .then(() => {
      // On ban complete, show ban complete details
      newLogEmbed.setTitle("Ban Complete!")
      newLogEmbed.setColor("GREEN")
      newLogEmbed.setFields(
        { name: "Progress", value: `100%`, inline: true },
        {
          name: "Est. Time Remaining",
          value: "0s",
          inline: true,
        },
        {
          name: "Users Banned",
          value: `${bannedNum} / ${totalBans}`,
          inline: true,
        },
        { name: "Errored Users", value: `${erroredUsers}`, inline: true }
      )
      confirmations.splice(confirmationIndex, 1)
      interaction.editReply({ embeds: [newLogEmbed], components: [] })
      newLogEmbed.setTitle("New Event: Bulk Ban")
      newLogEmbed.setFields(
        { name: "Users Banned", value: `${bannedNum}`, inline: true },
        { name: "Errored Users", value: `${erroredUsers}`, inline: true },
        {
          name: "Initialised By",
          value: `${userMention(interaction.member.id)}`,
        }
      )
      guildLogRef.send({ embeds: [newLogEmbed] })
      db.write()
      return
    })
    .catch((err) => {
      // On ban error, show ban error details
      newLogEmbed.setTitle("Ban Errored")
      newLogEmbed.setDescription(err.message)
      newLogEmbed.setColor("RED")
      newLogEmbed.setFields(
        { name: "Progress", value: `${percent}%`, inline: true },
        {
          name: "Est. Time Remaining",
          value: "Cancelled",
          inline: true,
        },
        {
          name: "Users Banned",
          value: `${bannedNum} / ${totalBans}`,
          inline: true,
        },
        { name: "Errored Users", value: `${erroredUsers}`, inline: true }
      )
      confirmations.splice(confirmationIndex, 1)
      interaction.editReply({ embeds: [newLogEmbed], components: [] })
      db.write()
      return
    })

  function updateProgress() {
    bannedNum += 1
    const newPercent = (bannedNum / totalBans) * 100
    const percentArray = [0, 100]
    // create a percentArray for checkpoints
    if (totalBans > 5000) {
      percentArray = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    } else if (totalBans > 1000) {
      percentArray = [25, 50, 75, 100]
    } else if (totalBans > 250) {
      percentArray = [33, 66, 100]
    }
    // find if a checkpoint hasn't been updated to yet
    const updToPercent = percentArray.find(
      (perItr) => perItr > newPercent && perItr > percent
    )
    // if there is a checkpoint, update to it and call sendPercentUpdate
    if (updToPercent) {
      percent = updToPercent
      return sendPercentUpdate()
    }
    return
  }

  // gets all currently available info and updates to it
  function sendPercentUpdate() {
    // calculate the estimated time remaining by dividing the % way through by the time diff between start and now
    const estTimeRemaining = new Date(
      bannedNum / totalBans / (Date.now() - startedAt)
    )

    newLogEmbed.setFields(
      { name: "Progress", value: `${percent}%`, inline: true },
      {
        name: "Est. Time Remaining",
        value: bannedNum
          ? `${estTimeRemaining.getMinutes()}m ${estTimeRemaining.getSeconds()}s`
          : "Unknown",
        inline: true,
      },
      {
        name: "Users Banned",
        value: `${bannedNum} / ${totalBans}`,
        inline: true,
      },
      { name: "Errored Users", value: `${erroredUsers}`, inline: true }
    )
    return interaction.editReply({ embeds: [newLogEmbed], components: [] })
  }
}
