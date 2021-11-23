import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { globalChecks } from "../index.js"

export const data = new SlashCommandSubcommandBuilder()
  .setName("list")
  .setDescription("Lists global checks")
  .addIntegerOption((option) =>
    option.setName("page").setDescription("Page of list").setRequired(false)
  )

export async function execute(interaction) {
  const page = interaction.options.getInteger("page")
  const commandEmbed = new MessageEmbed().setColor("#52e5ff")

  // if no page specified, default to first page
  // slice 25 results based on page
  page.value ||= 1
  commandEmbed.setTitle(`Global Checks: Page ${page.value}`)
  globalChecks.slice((page.value - 1) * 25, 25).forEach((check, inx) => {
    commandEmbed.addField(
      `${inx}: ${check.type}`,
      `\`${check.checkExp}\``,
      true
    )
  })
  return interaction.reply({ embeds: [commandEmbed] })
}
