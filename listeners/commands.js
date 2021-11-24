import { Collection } from "discord.js"
import { fetchCmdFiles } from "../util/fetchFiles.js"

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
    await command.execute(interaction)
  } catch (error) {
    console.error(error)
    await interaction.reply({
      content: "There was an error processing your command.",
      ephemeral: true,
    })
  }
}
