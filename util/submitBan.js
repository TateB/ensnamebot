import { userMention } from "@discordjs/builders"
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js"
import {
  confirmations,
  db,
  guildLogRef,
  guildPromptRef,
  ignoredUsers,
} from "../index.js"
import { logToConsole } from "./logToConsole.js"

// submits ban embed to log channel, if confirmationNeeded, wait for reaction before banning
export async function submitBan(
  member,
  reason,
  eventName,
  confirmationNeeded = true
) {
  // if user is an ignored user, don't submit a ban
  if (ignoredUsers.find((x) => x === member.user.id)) return

  // make sure if it's a manual sweep that the user doesn't already have a prompt listed (so no spam)
  if (
    eventName === "manual sweep" &&
    confirmations.find(
      (x) =>
        x.member.id === member.user.id || x.member.userId === member.user.id
    )
  )
    return

  const username = await member
    .fetch(true)
    .then((memberFetch) => memberFetch.user.username)
  const banEmbed = new MessageEmbed().setColor("#52e5ff").addFields(
    {
      name: "User",
      value: userMention(member.user.id),
    },
    { name: "Event Triggered", value: eventName },
    { name: "Reason", value: reason },
    { name: "Username on Trigger", value: username }
  )

  if (confirmationNeeded) {
    const buttons = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("requestban-ban")
        .setLabel("Ban")
        .setStyle("DANGER"),
      new MessageButton()
        .setCustomId("requestban-cancel")
        .setLabel("Cancel")
        .setStyle("SUCCESS"),
      new MessageButton()
        .setCustomId("requestban-ignore")
        .setLabel("Ignore")
        .setStyle("SECONDARY")
    )

    banEmbed.setTitle("Ban Requested")
    guildPromptRef
      .send({ embeds: [banEmbed], components: [buttons] })
      .then((message) =>
        confirmations.push({
          id: message.id,
          type: eventName === "emulation" ? "request-emu" : "request",
          member: member,
        })
      )
      .then(() => db.write())
      .then(() =>
        logToConsole(
          "submitBan",
          `${member.user.id} | Submitted ban request for ${username}`
        )
      )
  } else {
    // confirmation not needed, so user can be banned immediately
    const buttons = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("autoban-revert")
        .setLabel("Revert")
        .setStyle("DANGER")
    )

    banEmbed.setTitle("New Event: User Autobanned")
    guildLogRef
      .send({ embeds: [banEmbed], components: [buttons] })
      .then((message) =>
        confirmations.push({
          id: message.id,
          type: "autoban",
          member: member,
        })
      )
      .then(() => db.write())
      .then(() => (eventName === "emulation" ? null : member.ban()))
      .then(() =>
        logToConsole(
          "submitBan",
          `${member.user.id} | Autobanned user ${username}`
        )
      )
  }
}
