import { Client, Intents } from "discord.js"
import { readFileSync } from "fs"
import { JSONFile, Low } from "lowdb"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { startListeners } from "./listeners/listeners.js"
import { refreshPermissions } from "./util/refreshPermissions.js"
import { startSweepInterval } from "./util/sweep.js"

console.log("starting...")

export const {
  banConfirmations,
  guildId,
  clientId,
  channelIds,
  permittedRoleIds,
  token,
  autoSweepTime,
} = JSON.parse(readFileSync("./config.json"))

export const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_BANS,
    Intents.FLAGS.GUILD_PRESENCES,
  ],
  partials: ["GUILD_MEMBER", "USER", "REACTION"],
})

const __dirname = dirname(fileURLToPath(import.meta.url))

// use json for db storage
const file = join(__dirname, "db.json")
const adapter = new JSONFile(file)
export const db = new Low(adapter)
await db.read()
db.data ||= {
  importantUsers: [],
  ignoredUsers: [],
  globalChecks: [],
  confirmations: [],
}

export const { importantUsers, ignoredUsers, globalChecks, confirmations } =
  db.data

// stores most recent 100 member joins
export const membersJoined = []

// stores members most recent 1000 members who have changed their username
export const membersNameChanged = []

export var guildLogRef
export var guildPromptRef

client.once("ready", () => {
  const localGuild = client.guilds.cache.get(guildId)
  // make sure bot is only in whitelisted guild on ready
  client.guilds
    .fetch()
    .then((guilds) =>
      guilds.forEach((guild) =>
        guild.id !== guildId ? guild.leave() : console.log("guild confirmed!")
      )
    )

  // fetch all members to cache so their username changes can be caught (?)
  // not actually sure that this does anything
  localGuild.members.fetch({ force: true })

  // start auto sweep interval
  startSweepInterval()

  // make sure permissions are always correct
  refreshPermissions()
  console.log("bot ready")

  // set guildlogref and store in cache
  guildLogRef = localGuild.channels.cache.get(channelIds.logs)
  guildPromptRef = localGuild.channels.cache.get(channelIds.prompts)
})

// make sure that the guild joined is correct, or else leave immediately
client.on("guildCreate", (guild) =>
  guild.id !== guildId ? guild.leave() : console.log("guild confirmed!")
)

startListeners()

client.login(token)
