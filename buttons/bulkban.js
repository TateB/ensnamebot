import { userMention } from "@discordjs/builders"
import { MessageEmbed } from "discord.js"
import { confirmations, db, guildLogRef } from "../index.js"

export const name = "bulkban"

// bulk ban function for banning users between specific timestamps.
export async function execute(
  interaction,
  confirmation,
  confirmationIndex,
  type
) {
  if (type === "cancel") {
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
  var bannedNum = 0,
    totalBans = 0,
    percent = 0,
    erroredUsers = 0

  // defer update because it might take a while before the first message comes through
  return interaction
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
