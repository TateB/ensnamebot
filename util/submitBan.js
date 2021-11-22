import { userMention } from "@discordjs/builders"
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js"
import { confirmations, db, guildLogRef, guildPromptRef } from "../index.js"

// submits ban embed to log channel, if confirmationNeeded, wait for reaction before banning
export async function submitBan(
  member,
  reason,
  eventName,
  confirmationNeeded = true
) {
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
      new MessageButton().setCustomId("ban").setLabel("Ban").setStyle("DANGER"),
      new MessageButton()
        .setCustomId("cancel")
        .setLabel("Cancel")
        .setStyle("SUCCESS")
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
  } else {
    // confirmation not needed, so user can be banned immediately
    const buttons = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("revert")
        .setLabel("Revert")
        .setStyle("DANGER")
    )

    banEmbed.setTitle("User Autobanned")
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
  }
}
