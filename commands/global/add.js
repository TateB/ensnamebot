import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { db, globalChecks } from "../../index.js"

export const data = new SlashCommandSubcommandBuilder()
  .setName("add")
  .setDescription("Add a global check")
  .addStringOption((option) =>
    option
      .setName("type")
      .setDescription("Type of expression")
      .addChoices([
        ["Regex", "regex"],
        ["Exact", "exact"],
        ["Contains", "contains"],
      ])
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("expression")
      .setDescription("Expression string")
      .setRequired(true)
  )

export async function execute(interaction) {
  const type = interaction.options.get("type").value
  const expression = interaction.options.get("expression").value
  const commandEmbed = new MessageEmbed().setColor("#52e5ff")

  commandEmbed
    .setTitle("Global Check Added")
    .addFields(
      { name: "Index", value: `${globalChecks.length + 1}` },
      { name: "Expression", value: `\`${expression}\``, inline: true },
      { name: "Type", value: type, inline: true }
    )
  globalChecks.push({
    type: type,
    checkExp: expression,
  })
  db.write()
  return interaction.reply({ embeds: [commandEmbed] })
}
