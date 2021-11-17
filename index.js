import { userMention } from "@discordjs/builders"
import {
  Client,
  Intents,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js"
import { readFileSync } from "fs"
import { JSONFile, Low } from "lowdb"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { startListeners } from "./listeners/listeners.js"

const { guildId, clientId, logChannelId, token, permittedRoleIds } = JSON.parse(
  readFileSync("./config.json")
)

export const { banConfirmations } = JSON.parse(readFileSync("./config.json"))

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
db.data ||= { importantUsers: [], globalChecks: [], confirmations: [] }

export const { importantUsers, globalChecks, confirmations } = db.data

// stores most recent 100 member joins
export const membersJoined = []

// stores members most recent 1000 members who have changed their username
export const membersNameChanged = []

export var guildLogRef

client.once("ready", () => {
  const localGuild = client.guilds.cache.get(guildId)
  // make sure bot is only in whitelisted guild on ready
  client.guilds
    .fetch()
    .forEach((guild) =>
      guild.id !== guildId ? guild.leave() : console.log("guild confirmed!")
    )

  // make sure permissions are always correct
  refreshPermissions()
  console.log("bot ready")

  // set guildlogref and store in cache
  guildLogRef = localGuild.channels.cache.get(logChannelId)
})

// make sure that the guild joined is correct, or else leave immediately
client.on("guildCreate", (guild) =>
  guild.id !== guildId ? guild.leave() : console.log("guild confirmed!")
)

export async function refreshPermissions() {
  const localGuild = client.guilds.cache.get(guildId)
  var idsArray = []

  return localGuild.commands
    .fetch()
    .then((data) => data.filter((x) => x.applicationId === clientId))
    .then((data) => data.map((x) => x.id))
    .then((commIds) => (idsArray = commIds))
    .then(() =>
      Promise.all(idsArray.map((id) => localGuild.commands.fetch(id)))
    )
    .then((fetchedComms) =>
      Promise.all(
        fetchedComms.map((comm) =>
          comm.permissions.set({
            guild: guildId,
            command: comm.id,
            permissions: permittedRoleIds.map((roleId) => ({
              id: roleId,
              type: "ROLE",
              permission: true,
            })),
          })
        )
      )
    )
    .then(() => console.log("permissions verified and set"))
    .catch(console.error)
}

startListeners()

// check for regex match with importantUsers
export function importantUserCheck(username) {
  return new Promise((resolve, reject) => {
    importantUsers.forEach((importantUser) => {
      const regex = new RegExp(importantUser.checkExp)
      if (regex.test(username)) resolve(importantUser.username)
    })
    resolve(false)
  })
}

// check for match with global expressions array
export function globalExpCheck(username) {
  return new Promise((resolve, reject) => {
    globalChecks.forEach((checkEntry) => {
      const { type, checkExp } = checkEntry

      // switch for type of check
      switch (type) {
        case "regex": {
          const regex = new RegExp(checkExp, "i")
          if (regex.test(username)) resolve(checkEntry)
          break
        }
        case "exact": {
          if (username === checkExp) resolve(checkEntry)
          break
        }
        case "contains": {
          if (username.includes(checkExp)) resolve(checkEntry)
          break
        }
        default:
          break
      }
    })
    resolve(false)
  })
}

// submits ban embed to log channel, if confirmationNeeded, wait for reaction before banning
export async function submitBan(
  member,
  reason,
  eventName,
  confirmationNeeded = true
) {
  const banEmbed = new MessageEmbed().setColor("#52e5ff").addFields(
    {
      name: "User",
      value: userMention(member.user.id),
    },
    { name: "Event Triggered", value: eventName },
    { name: "Reason", value: reason }
  )

  if (confirmationNeeded) {
    const buttons = new MessageActionRow().addComponents(
      new MessageButton().setCustomId("ban").setLabel("Ban").setStyle("DANGER"),
      new MessageButton()
        .setCustomId("cancel")
        .setLabel("Cancel")
        .setStyle("SUCCESS")
    )

    banEmbed.setTitle("Ban Requested")
    guildLogRef
      .send({ embeds: [banEmbed], components: [buttons] })
      .then((message) =>
        confirmations.push({
          id: message.id,
          type: "request",
          member: member,
        })
      )
      .then(() => db.write())
  } else {
    // confirmation not needed, so user can be banned immediately
    const buttons = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("revert")
        .setLabel("Revert")
        .setStyle("DANGER")
    )

    banEmbed.setTitle("User Autobanned")
    guildLogRef
      .send({ embeds: [banEmbed], components: [buttons] })
      .then((message) =>
        confirmations.push({
          id: message.id,
          type: "autoban",
          member: member,
        })
      )
      .then(() => db.write())
      .then(() => member.ban())
  }
}

client.login(token)
