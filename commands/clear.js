import { SlashCommandBuilder } from "@discordjs/builders"

export const data = new SlashCommandBuilder()
  .setName("clear")
  .setDescription("Clears/cancels all existing ban prompts")
  .setDefaultPermission(false)

export async function execute(interaction) {
  const { confirmations, db, guildPromptRef } = await import("../index.js")
  const { logToConsole } = await import("../util/logToConsole.js")

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
            .catch((err) =>
              logToConsole(
                "clear",
                `Failed to clear prompts - ${err.message}`,
                true
              )
            )
        })
      )
    )
    .then(() => db.write())
    .then(() => interaction.editReply("Cleared all prompts!"))
}
