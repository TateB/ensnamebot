import { SlashCommandSubcommandBuilder, userMention } from "@discordjs/builders"
import { db, importantUsers } from "../index.js"

export const data = new SlashCommandSubcommandBuilder()
  .setName("remove")
  .setDescription("Remove a user from checks")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("User to remove from checks")
      .setRequired(true)
  )

export async function execute(interaction) {
  const commandEmbed = new MessageEmbed().setColor("#52e5ff")
  const user = interaction.options.getUser("user")
  const userEntry = importantUsers.find((x) => x.id === user.id)
  const expression = userEntry.checkExp
  const userIndex = importantUsers.findIndex((x) => x.id === user.id)

  // check if user isn't in db already
  if (!userEntry)
    return interaction.reply({
      content: "That user isn't in the checks list",
      ephemeral: true,
    })

  // if user is in db, remove them, then notify
  commandEmbed
    .setTitle("User Check Removed")
    .addFields(
      { name: "User", value: userMention(user.id) },
      { name: "Expression", value: `\`${expression}\`` }
    )

  importantUsers.splice(userIndex, 1)
  db.write()
  return interaction.reply({ embeds: [commandEmbed] })
}
