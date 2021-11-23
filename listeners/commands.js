import { Collection } from "discord.js"
import { fetchCmdFiles } from "../util/fetchCmdFiles.js"

const commands = new Collection()
await fetchCmdFiles("commands").then((fetchedCmds) =>
  fetchedCmds.forEach((cmd) => commands.set(cmd.data.name, cmd))
)

// Interaction listener for commands
export async function commandListener(interaction) {
  const command = commands.get(interaction.commandName)
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
