import { SlashCommandBuilder } from "@discordjs/builders"
import { runSweep } from "../util/sweep"

export const data = new SlashCommandBuilder()
  .setName("sweep")
  .setDescription("Manually sweeps all current users for matches")
  .setDefaultPermission(false)

export async function execute(interaction) {
  return interaction
    .deferReply({ ephemeral: true })
    .then(() => runSweep())
    .then(() => interaction.reply("Manual sweep complete!"))
}
