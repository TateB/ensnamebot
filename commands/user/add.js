import { SlashCommandSubcommandBuilder, userMention } from "@discordjs/builders"
import unhomoglyph from "unhomoglyph"
import { db, importantUsers } from "../index.js"

export const data = new SlashCommandSubcommandBuilder()
  .setName("add")
  .setDescription("Add a user to checks")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("User to add to checks")
      .setRequired(true)
  )

export async function execute(interaction) {
  const commandEmbed = new MessageEmbed().setColor("#52e5ff")
  const user = interaction.options.getUser("user")
  const expression = `(^.*)(${unhomoglyph(user.username)})(.*$)`
  const userEntry = importantUsers.find((x) => x.id === user.id)

  // check if user already exists in db
  if (userEntry) {
    commandEmbed
      .setTitle("User Check Already Exists")
      .addFields(
        { name: "User", value: userMention(user.id) },
        { name: "Expression", value: `\`${userEntry.checkExp}\`` }
      )

    interaction.reply({ embeds: [commandEmbed] })
  } else {
    commandEmbed
      .setTitle("User Check Added")
      .addFields(
        { name: "User", value: userMention(user.id) },
        { name: "Expression", value: `\`${expression}\`` }
      )
    importantUsers.push({
      id: user.id,
      username: user.username,
      checkExp: expression,
    })
    db.write()
  }
  return interaction.reply({ embeds: [commandEmbed] })
}
