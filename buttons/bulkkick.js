import { userMention } from "@discordjs/builders"
import { MessageEmbed } from "discord.js"
import { confirmations, db, guildLogRef } from "../index.js"

export const name = "bulkkick"

// function for kicking users with no role, who joined before the grace period
export async function execute(
  interaction,
  confirmation,
  confirmationIndex,
  type
) {
  // if cancel button, cancel the action and return
  if (type === "cancel") {
    const newLogEmbed = new MessageEmbed()
      .setColor("#52e5ff")
      .setTitle("Bulk Kick Cancelled")

    confirmations.splice(confirmationIndex, 1)
    interaction.update({ embeds: [newLogEmbed], components: [] })
    db.write()
    return
  }

  const newLogEmbed = new MessageEmbed()
    .setColor("#52e5ff")
    .setTitle("Kicking Members...")
  // date for calculating estimated time
  const startedAt = Date.now()
  const { upToJoinedTime } = confirmation
  const everyoneRole = interaction.guild.roles.everyone.id
  var kickedNum = 0,
    totalKicks = 0,
    percent = 0,
    erroredUsers = 0

  // defer update because it might take a while before the first message comes through
  return (
    interaction
      .update({
        embeds: [new MessageEmbed().setTitle("Starting bulk kick...")],
        components: [],
      })
      .then(() => interaction.guild.members.fetch({ force: true }))
      // filter to users who joined before the grace period, and don't have a role, and sort by joinedTimestamp
      .then((allMembers) =>
        allMembers
          .filter(
            (member) =>
              member.joinedTimestamp < upToJoinedTime &&
              member.roles.highest.id === everyoneRole
          )
          .sorted(
            (memberA, memberB) =>
              memberA.joinedTimestamp - memberB.joinedTimestamp
          )
      )
      .then((kickableMembers) => {
        // send the first percent update at 0
        totalKicks = kickableMembers.size
        sendPercentUpdate()
        return kickableMembers
      })
      .then((kickableMembers) =>
        Promise.all(
          kickableMembers.map((member) =>
            // kick each member, and call the updateProgress event
            member
              .kick("bulk kick")
              .then(updateProgress)
              .catch(() => erroredUsers + 1)
          )
        )
      )
      .then(() => {
        // On kicks complete, show kicks complete details
        newLogEmbed.setTitle("Kicks Complete!")
        newLogEmbed.setColor("GREEN")
        newLogEmbed.setFields(
          { name: "Progress", value: `100%`, inline: true },
          {
            name: "Est. Time Remaining",
            value: "0s",
            inline: true,
          },
          {
            name: "Users Kicked",
            value: `${kickedNum} / ${totalKicks}`,
            inline: true,
          },
          { name: "Errored Users", value: `${erroredUsers}`, inline: true }
        )
        confirmations.splice(confirmationIndex, 1)
        interaction.editReply({ embeds: [newLogEmbed], components: [] })
        newLogEmbed.setTitle("New Event: Bulk Kick")
        newLogEmbed.setFields(
          { name: "Users Kicked", value: `${kickedNum}`, inline: true },
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
        // On kicks error, show kicks error details
        newLogEmbed.setTitle("Kicks Errored")
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
            name: "Users Kicked",
            value: `${kickedNum} / ${totalKicks}`,
            inline: true,
          },
          { name: "Errored Users", value: `${erroredUsers}`, inline: true }
        )
        confirmations.splice(confirmationIndex, 1)
        interaction.editReply({ embeds: [newLogEmbed], components: [] })
        db.write()
        return
      })
  )

  function updateProgress() {
    kickedNum += 1
    const newPercent = (kickedNum / totalKicks) * 100
    const percentArray = [0, 100]
    // create a percentArray for checkpoints
    if (kickedNum > 5000) {
      percentArray = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    } else if (kickedNum > 1000) {
      percentArray = [25, 50, 75, 100]
    } else if (kickedNum > 250) {
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
      kickedNum / totalKicks / (Date.now() - startedAt)
    )

    newLogEmbed.setFields(
      { name: "Progress", value: `${percent}%`, inline: true },
      {
        name: "Est. Time Remaining",
        value: kickedNum
          ? `${estTimeRemaining.getMinutes()}m ${estTimeRemaining.getSeconds()}s`
          : "Unknown",
        inline: true,
      },
      {
        name: "Users Kicked",
        value: `${kickedNum} / ${totalKicks}`,
        inline: true,
      },
      { name: "Errored Users", value: `${erroredUsers}`, inline: true }
    )
    return interaction.editReply({ embeds: [newLogEmbed], components: [] })
  }
}
