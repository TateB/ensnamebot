import { Collection } from "discord.js"
import { fetchCmdFiles } from "../util/fetchFiles.js"
import { logToConsole } from "../util/logToConsole.js"

export async function fetchSetCommands(client) {
  client.commands = new Collection()
  return await fetchCmdFiles("commands").then((fetchedCmds) =>
    fetchedCmds.forEach((cmd) => client.commands.set(cmd.data.name, cmd))
  )
}

// Interaction listener for commands
export async function commandListener(interaction) {
  const command = interaction.client.commands.get(interaction.commandName)
  try {
    logToConsole(
      "commands",
      `Received command /${interaction.commandName} - attempting now...`
    )
    await command.execute(interaction)
    logToConsole("commands", `Completed command /${interaction.commandName}`)
  } catch (error) {
    logToConsole(
      "commands",
      `Error executing command /${interaction.commandName} - ${error.message}`,
      true
    )
    await interaction
      .reply({
        content: "There was an error processing your command.",
        ephemeral: true,
      })
      .catch(() =>
        interaction.editReply({
          content: "There was an error processing your command.",
          ephemeral: true,
        })
      )
  }
}
