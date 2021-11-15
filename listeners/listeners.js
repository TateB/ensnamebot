import { client } from "../index.js"
import { buttonListener } from "./buttons.js"
import { commandListener } from "./commands.js"
import { userJoinListener } from "./userJoin.js"
import { usernameChangeListener } from "./usernameChange.js"

export function startListeners() {
  client.on("interactionCreate", (interaction) => {
    if (interaction.isButton()) return buttonListener(interaction)
    if (interaction.isCommand()) return commandListener(interaction)
  })
  client.on("guildMemberAdd", userJoinListener)
  client.on("userUpdate", usernameChangeListener)
}
