import { db, globalChecks } from "../../index.js"

export async function globalHandler(interaction, commandEmbed) {
  switch (interaction.options.getSubcommand()) {
    case "add": {
      const type = interaction.options.get("type").value
      const expression = interaction.options.get("expression").value

      commandEmbed
        .setTitle("Global Check Added")
        .addFields(
          { name: "Index", value: globalChecks.length + 1 },
          { name: "Expression", value: expression, inline: true },
          { name: "Type", value: type, inline: true }
        )
      globalChecks.push({
        type: type,
        checkExp: expression,
      })
      db.write()
      interaction.reply({ embeds: [commandEmbed] })
      break
    }
    case "remove": {
      const index = interaction.options.getInteger("index")

      // if index doesn't exist, tell user
      if (!globalChecks[index]) {
        interaction.reply({
          content: "A global check doesn't exist at that index.",
          ephemeral: true,
        })
        break
      } else {
        commandEmbed.setTitle("Global Check Removed").addFields(
          { name: "Index", value: index },
          {
            name: "Expression",
            value: globalChecks[index].checkExp,
            inline: true,
          },
          { name: "Type", value: globalChecks[index].type, inline: true }
        )

        globalChecks.splice(index, 1)
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
        commandEmbed.setTitle("Global Checks: Page 1")
        globalChecks.slice(0, 25).forEach((check, inx) => {
          commandEmbed.addField(`${inx}: ${check.type}`, check.checkExp, true)
        })
        interaction.reply({ embeds: [commandEmbed] })
        break
      } else {
        commandEmbed.setTitle(`Global Checks: Page ${page.value}`)
        globalChecks.slice((page.value - 1) * 25, 25).forEach((check, inx) => {
          commandEmbed.addField(`${inx}: ${check.type}`, check.checkExp, true)
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
