import { SlashCommandBuilder } from "@discordjs/builders"

export const data = new SlashCommandBuilder()
  .setName("normalise")
  .setDescription("Normalise/unhomoglyph a name")
  .setDefaultPermission(false)
  .addStringOption((option) =>
    option
      .setName("value")
      .setDescription("Value to normalise")
      .setRequired(true)
  )

export async function execute(interaction) {
  const value = interaction.options.get("value").value
  const normalised = unhomoglyph(value)

  return interaction.reply(`Normalised value: \`${normalised}\``)
}
