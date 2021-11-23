import { SlashCommandSubcommandBuilder, userMention } from "@discordjs/builders"
import { db, importantUsers } from "../index.js"

export const data = new SlashCommandSubcommandBuilder()
  .setName("set")
  .setDescription("Set a user check")
  .addUserOption((option) =>
    option.setName("user").setDescription("User to set check").setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("expression")
      .setDescription("Expression string (regex)")
      .setRequired(true)
  )

export async function execute(interaction) {
  const commandEmbed = new MessageEmbed().setColor("#52e5ff")
  const user = interaction.options.getUser("user")
  const expressionFull = interaction.options.get("expression")
  const userEntry = importantUsers.find((x) => x.id === user.id)
  var expression = ""

  // if expression is left blank, generate one for the user
  if (expressionFull === null)
    return interaction.reply({
      content: "Please provide a regex expression.",
      ephemeral: true,
    })

  expression = expressionFull.value

  commandEmbed
    .setTitle("User Check Set")
    .addFields(
      { name: "User", value: userMention(user.id) },
      { name: "Expression", value: `\`${expression}\`` }
    )

  // if user already exists in array, update user
  if (userEntry) {
    userEntry.username = user.username
    userEntry.checkExp = expression
  } else {
    importantUsers.push({
      id: user.id,
      username: user.username,
      checkExp: expression,
    })
  }
  db.write()
  return interaction.reply({ embeds: [commandEmbed] })
}
