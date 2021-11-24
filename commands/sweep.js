import { SlashCommandBuilder } from "@discordjs/builders"

export const data = new SlashCommandBuilder()
  .setName("sweep")
  .setDescription("Manually sweeps all current users for matches")
  .setDefaultPermission(false)

export async function execute(interaction) {
  const { runSweep } = await import("../util/sweep.js")

  return interaction
    .deferReply({ ephemeral: true })
    .then(() => runSweep())
    .then(() => interaction.editReply("Manual sweep complete!"))
}
