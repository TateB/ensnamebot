import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { db, globalChecks } from "../index.js"

export const data = new SlashCommandSubcommandBuilder()
  .setName("remove")
  .setDescription("Remove a global check")
  .addIntegerOption((option) =>
    option
      .setName("index")
      .setDescription("Index of global check (if you don't know, use list)")
      .setRequired(true)
  )

export async function execute(interaction) {
  const commandEmbed = new MessageEmbed().setColor("#52e5ff")
  const index = interaction.options.getInteger("index")

  // if index doesn't exist, tell user
  if (!globalChecks[index])
    return interaction.reply({
      content: "A global check doesn't exist at that index.",
      ephemeral: true,
    })

  // if it does, remove check and generate embed to tell user
  commandEmbed.setTitle("Global Check Removed").addFields(
    { name: "Index", value: `${index}` },
    {
      name: "Expression",
      value: `\`${globalChecks[index].checkExp}\``,
      inline: true,
    },
    { name: "Type", value: globalChecks[index].type, inline: true }
  )

  globalChecks.splice(index, 1)
  db.write()
  return interaction.reply({ embeds: [commandEmbed] })
}
