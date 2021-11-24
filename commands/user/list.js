import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { MessageEmbed } from "discord.js"

export const data = new SlashCommandSubcommandBuilder()
  .setName("list")
  .setDescription("Lists user checks")
  .addIntegerOption((option) =>
    option.setName("page").setDescription("Page of list").setRequired(false)
  )

export async function execute(interaction) {
  const { importantUsers } = await import("../../index.js")

  const commandEmbed = new MessageEmbed().setColor("#52e5ff")
  const page = interaction.options.getInteger("page") || { value: 1 }

  // if no page specified, default to first page
  // slice 25 results based on page
  commandEmbed.setTitle(`User Checks: Page ${page.value}`)
  importantUsers.slice((page.value - 1) * 25, 25).forEach((importantUser) => {
    commandEmbed.addField(
      importantUser.username,
      `\`${importantUser.checkExp}\``,
      true
    )
  })
  return interaction.reply({ embeds: [commandEmbed] })
}
