import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import { readFileSync } from "fs"
import { fetchCmdFiles } from "./util/fetchCmdFiles.js"
const { guildId, clientId, token } = JSON.parse(readFileSync("./config.json"))

const commands = await fetchCmdFiles("commands").then((commands) =>
  commands.map((cmd) => cmd.data.toJSON())
)

const rest = new REST({ version: "9" }).setToken(token)

rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error)
