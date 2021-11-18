import { userMention } from "@discordjs/builders"
import unhomoglyph from "unhomoglyph"
import { db, importantUsers } from "../../index.js"

export async function userHandler(interaction, commandEmbed) {
  switch (interaction.options.getSubcommand()) {
    case "set": {
      const user = interaction.options.getUser("user")
      const expressionFull = interaction.options.get("expression")
      const userEntry = importantUsers.find((x) => x.id === user.id)
      var expression = ""

      // if expression is left blank, generate one for the user
      if (expressionFull === null) {
        interaction.reply({
          content: "Please provide a regex expression.",
          ephemeral: true,
        })
      } else {
        expression = expressionFull.value
      }

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
      interaction.reply({ embeds: [commandEmbed] })
      break
    }
    case "remove": {
      const user = interaction.options.getUser("user")
      const userEntry = importantUsers.find((x) => x.id === user.id)
      const expression = userEntry.checkExp
      const userIndex = importantUsers.findIndex((x) => x.id === user.id)

      // check if user isn't in db already
      if (!userEntry) {
        interaction.reply({
          content: "That user isn't in the checks list",
          ephemeral: true,
        })
        break
      } else {
        commandEmbed
          .setTitle("User Check Removed")
          .addFields(
            { name: "User", value: userMention(user.id) },
            { name: "Expression", value: `\`${expression}\`` }
          )

        importantUsers.splice(userIndex, 1)
        db.write()
        interaction.reply({ embeds: [commandEmbed] })
        break
      }
    }
    case "add": {
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
        break
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
        interaction.reply({ embeds: [commandEmbed] })
        break
      }
    }
    case "list": {
      const page = interaction.options.getInteger("page")

      // if no page specified, default to first page
      // slice 25 results based on page
      if (!page) {
        commandEmbed.setTitle("User Checks: Page 1")
        importantUsers.slice(0, 25).forEach((importantUser) => {
          commandEmbed.addField(
            importantUser.username,
            `\`${importantUser.checkExp}\``,
            true
          )
        })
        interaction.reply({ embeds: [commandEmbed] })
        break
      } else {
        commandEmbed.setTitle(`User Checks: Page ${page.value}`)
        importantUsers
          .slice((page.value - 1) * 25, 25)
          .forEach((importantUser) => {
            commandEmbed.addField(
              importantUser.username,
              `\`${importantUser.checkExp}\``,
              true
            )
          })
        interaction.reply({ embeds: [commandEmbed] })
        break
      }
    }
    default: {
      interaction.reply({
        content: "There was an error processing your command.",
        ephemeral: true,
      })
      break
    }
  }
}
