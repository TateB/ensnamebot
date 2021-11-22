import { guildLogRef } from "../index.js"

export const createLogEntryWithTimeout = (logEmbed, interaction) =>
  interaction
    .update({ embeds: [logEmbed], components: [] })
    .then(
      () =>
        new Promise(
          (resolve) => setTimeout(() => resolve(), 15000) // 15 second timeout so user can see prompt
        )
    )
    .then(() => interaction.message.delete())
    .then(() => logEmbed.setTitle(`New Event: ${logEmbed.title}`))
    .then(() => guildLogRef.send({ embeds: [logEmbed] }))
