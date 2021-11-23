import { readdirSync } from "fs"

// dynamically load all command files
export async function fetchCmdFiles(dir) {
  const commands = []
  const commandFiles = readdirSync(`./${dir}`).filter((file) =>
    file.endsWith("js")
  )
  const directories = readdirSync(`./${dir}`, { withFileTypes: true })
    .filter((file) => file.isDirectory())
    .map((file) => file.name)

  for (const file of commandFiles) {
    const command = await import(`../${dir}/${file}`)
    commands.push(command)
  }

  // recursively load all subdirectories/subcommands
  for (const directory of directories) {
    const subcommands = await fetchCmdFiles(`${dir}/${directory}`)
    let command = commands.find((command) => command.data.name === directory)
    subcommands.forEach((cmd) => command.data.addSubcommand(cmd.data))
    // clone command and add subcommands
    command = { ...command, subcommands }
    // set execute function to execute subcommand
    command.execute = (interaction) =>
      command.subcommands
        .find(
          (subcommand) =>
            subcommand.data.name === interaction.options.getSubcommand()
        )
        .execute(interaction)
  }

  return commands
}
