import { userMention } from "@discordjs/builders"
import { MessageEmbed } from "discord.js"
import { db, globalChecks, importantUsers, submitBan } from ".."

// Interaction listener for commands
export async function commandListener(interaction) {
  const commandEmbed = new MessageEmbed().setColor("#52e5ff")

  // switch between commands
  switch (interaction.commandName) {
    case "addglobalcheck": {
      const type = interaction.options.get("type").value
      const expression = interaction.options.get("expression").value

      commandEmbed
        .setTitle("Global Check Added")
        .addFields(
          { name: "Expression", value: expression },
          { name: "Type", value: type }
        )
      globalChecks.push({
        type: type,
        checkExp: expression,
      })
      db.write()
      interaction.reply({ embeds: [commandEmbed] })
      break
    }
    case "setusercheck": {
      const user = interaction.options.getUser("user")
      const expression = interaction.options.get("expression").value
      const userEntry = importantUsers.find((x) => x.id === user.id)

      commandEmbed
        .setTitle("User Check Set")
        .addFields(
          { name: "User", value: userMention(user.id) },
          { name: "Expression", value: expression }
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
      interaction.reply({ embeds: [commandEmbed] })
      break
    }
    case "emulateban": {
      const user = interaction.options.getUser("user")
      const type = interaction.options.get("type").value
      const reason = interaction.options.get("reason").value

      submitBan(
        interaction.guild.members.cache.get(user.id),
        reason,
        "emulation",
        type === "autoban" ? false : true
      )
      interaction.reply("Emulating ban...")
      break
    }
    default: {
      interaction.reply("There was an error processing your command.")
      break
    }
  }
}
