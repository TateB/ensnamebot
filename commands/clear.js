import { SlashCommandBuilder } from "@discordjs/builders"
import { confirmations, db, guildPromptRef } from "../index.js"

export const data = new SlashCommandBuilder()
  .setName("clear")
  .setDescription("Clears/cancels all existing ban prompts")
  .setDefaultPermission(false)

export async function execute(interaction) {
  const confirmsToClear = confirmations.filter((x) => x.type === "request")
  return interaction
    .deferReply({ ephemeral: true })
    .then(() =>
      Promise.all(
        confirmsToClear.map((confirm) => {
          const index = confirmations.findIndex((x) => x === confirm)
          confirmations.splice(index, 1)
          return guildPromptRef.messages
            .fetch(confirm.id)
            .then((msg) => msg.delete())
            .catch(console.error)
        })
      )
    )
    .then(() => db.write())
    .then(() => interaction.editReply("Cleared all prompts!"))
}
