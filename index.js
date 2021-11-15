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
import unhomoglyph from "unhomoglyph"
import { fileURLToPath } from "url"

const { guildId, logChannelId, token } = JSON.parse(
  readFileSync("./config.json")
)

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_BANS,
  ],
  partials: ["GUILD_MEMBER", "USER", "REACTION"],
})

const __dirname = dirname(fileURLToPath(import.meta.url))

// use json for db storage
const file = join(__dirname, "db.json")
const adapter = new JSONFile(file)
const db = new Low(adapter)
await db.read()
db.data ||= { importantUsers: [], globalChecks: [], confirmations: [] }

const { importantUsers, globalChecks, confirmations } = db.data

// stores most recent 100 member joins
const membersJoined = []

// stores members most recent 1000 members who have changed their username
const membersNameChanged = []

var guildLogRef

client.once("ready", () => {
  console.log("bot ready")
  // set guildlogref and store in cache
  guildLogRef = client.guilds.cache
    .get(guildId)
    .channels.cache.get(logChannelId)
})

// check for regex match with importantUsers
function importantUserCheck(username) {
  return new Promise((resolve, reject) => {
    importantUsers.forEach((importantUser) => {
      const regex = new RegExp(importantUser.checkExp)
      if (regex.test(username)) resolve(importantUser.username)
    })
    resolve(false)
  })
}

// check for match with global expressions array
function globalExpCheck(username) {
  return new Promise((resolve, reject) => {
    globalChecks.forEach((checkEntry) => {
      const { type, checkExp } = checkEntry
      switch (type) {
        case "regex": {
          const regex = new RegExp(checkExp, "i")
          console.log(regex.test(username))
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

client.on("guildMemberAdd", async (member) => {
  // normalise username
  member.user.username = unhomoglyph(member.user.username)
  const { id } = member
  const username = member.user.username

  // if user is configured in importantUsers, skip function
  if (importantUsers.find((x) => x.id === id)) return

  // if in membersJoined there is a match in username, autoban user
  if (membersJoined.find((x) => x.user.username === username))
    return submitBan(
      member,
      "matched username in recent joins",
      "new user joined"
    )

  const importantUserMatched = await importantUserCheck(username)
  if (importantUserMatched)
    return submitBan(
      member,
      `regex match: ${importantUserMatched}`,
      "new user joined"
    )

  const globalExpMatched = await globalExpCheck(username)
  if (globalExpMatched)
    return submitBan(
      member,
      `global match found for ${globalExpMatched.type} exp: ${globalExpMatched.checkExp}`,
      "new user joined"
    )

  // keep membersJoined array at length of 100
  if (membersJoined.length === 100) membersJoined.shift()
  return membersJoined.push(member)
})

client.on("userUpdate", async (oldUser, newUser) => {
  console.log(newUser)
  // if username hasn't changed, the member update doesn't matter
  if (oldUser.username === newUser.username) return

  // if user is configured in importantUsers, skip function
  if (importantUsers.find((x) => x.id === newUser.id)) return

  // normalises new and old usernames
  oldUser.username = unhomoglyph(oldUser.username)
  newUser.username = unhomoglyph(newUser.username)

  // if id matches an item in membersNameChanged, and there has been less than 5 minutes since last change, autoban user
  if (
    membersNameChanged.find(
      (x) => x.id === newUser.id && x.timeSet < Date.now() + 300000
    )
  )
    return submitBan(
      guildLogRef.guild.members.cache.get(newUser.id),
      "changed username twice in 5 minutes",
      "member username update"
    )

  const importantUserMatched = await importantUserCheck(newUser.username)
  if (importantUserMatched)
    return submitBan(
      guildLogRef.guild.members.cache.get(newUser.id),
      `regex match: ${importantUserMatched}`,
      "member username update"
    )

  const globalExpMatched = await globalExpCheck(newUser.username)
  if (globalExpMatched)
    return submitBan(
      guildLogRef.guild.members.cache.get(newUser.id),
      `global match found for ${globalExpMatched.type} exp: ${globalExpMatched.checkExp}`,
      "member username update"
    )

  // keep membersNameChanged array at length of 1000
  if (membersNameChanged.length === 1000) membersNameChanged.shift()
  return membersNameChanged.push({ id: newUser.id, timeSet: Date.now() })
})

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return
  const confirmationIndex = confirmations.findIndex(
    (x) => x.id === interaction.message.id
  )

  console.log(confirmationIndex)

  // if confirmation couldn't be found, return as the reaction isn't relevant
  if (confirmationIndex === -1) return

  const confirmation = confirmations[confirmationIndex]
  const hasBanPermissions = interaction.guild.members.cache
    .get(interaction.user.id)
    .permissions.has("BAN_MEMBERS")

  if (!hasBanPermissions) return

  const newLogEmbed = new MessageEmbed().setColor("#52e5ff")
  const targetMember =
    interaction.customId !== "revert"
      ? await interaction.guild.members
          .fetch({
            user: confirmation.member.id || confirmation.member.userId,
            force: true,
          })
          .catch(console.error)
      : undefined

  console.log(targetMember)

  // targetMember will be undefined if user is banned, make sure error isn't thrown and inform user
  if (
    targetMember === undefined &&
    (interaction.customId === "ban" || interaction.customId === "cancel")
  ) {
    newLogEmbed
      .setTitle("User Already Banned")
      .setDescription("Action failed because user is already banned.")
    confirmations.splice(confirmationIndex, 1)
    interaction.update({ embeds: [newLogEmbed], components: [] })
    db.write()
    return
  }

  // match to button id
  switch (interaction.customId) {
    case "ban": {
      newLogEmbed.setTitle("Ban Request Finalised").addFields(
        {
          name: "User",
          value: userMention(targetMember.id),
          inline: true,
        },
        {
          name: "Confirmed By",
          value: userMention(interaction.user.id),
          inline: true,
        }
      )
      targetMember.ban().catch(console.error)
      confirmations.splice(confirmationIndex, 1)
      interaction.update({ embeds: [newLogEmbed], components: [] })
      db.write()
      break
    }
    case "cancel": {
      newLogEmbed.setTitle("Ban Request Cancelled").addFields(
        {
          name: "Username/Tag",
          value: userMention(targetMember.id),
          inline: true,
        },
        {
          name: "Cancelled By",
          value: userMention(interaction.user.id),
          inline: true,
        }
      )
      confirmations.splice(confirmationIndex, 1)
      interaction.update({ embeds: [newLogEmbed], components: [] })
      db.write()
      break
    }
    case "revert": {
      newLogEmbed.setTitle("Autoban Removed").addFields(
        {
          name: "Username/Tag",
          value: userMention(
            confirmation.member.id || confirmation.member.userId
          ),
          inline: true,
        },
        {
          name: "Removed By",
          value: userMention(interaction.user.id),
          inline: true,
        }
      )
      interaction.guild.members
        .unban(confirmation.member.id || confirmation.member.userId)
        .catch(console.error)
      confirmations.splice(confirmationIndex, 1)
      interaction.update({ embeds: [newLogEmbed], components: [] })
      db.write()
      break
    }
    default: {
      break
    }
  }
})

// Interaction listener for commands
client.on("interactionCreate", (interaction) => {
  if (!interaction.isCommand()) return
  const commandEmbed = new MessageEmbed().setColor("#52e5ff")

  switch (interaction.commandName) {
    case "addglobalcheck": {
      const type = interaction.options.get("type").value
      const expression = interaction.options.get("expression").value

      commandEmbed
        .setTitle("Global Check Added")
        .addFields(
          { name: "Expression", value: expression },
          { name: "Type", value: type }
        )
      globalChecks.push({
        type: type,
        checkExp: expression,
      })
      db.write()
      interaction.reply({ embeds: [commandEmbed] })
      break
    }
    case "setusercheck": {
      const user = interaction.options.getUser("user")
      const expression = interaction.options.get("expression").value
      const userEntry = importantUsers.find((x) => x.id === user.id)

      commandEmbed
        .setTitle("User Check Set")
        .addFields(
          { name: "User", value: userMention(user.id) },
          { name: "Expression", value: expression }
        )

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
    case "emulateban": {
      const user = interaction.options.getUser("user")
      const type = interaction.options.get("type").value
      const reason = interaction.options.get("reason").value

      submitBan(
        interaction.guild.members.cache.get(user.id),
        reason,
        "emulation",
        type === "autoban" ? false : true
      )
      interaction.reply("Emulating ban...")
      break
    }
    default: {
      interaction.reply("There was an error processing your command.")
      break
    }
  }
})

// submits ban embed to log channel, if confirmationNeeded, wait for reaction before banning
async function submitBan(member, reason, eventName, confirmationNeeded = true) {
  console.log(member, reason, eventName, confirmationNeeded)

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
      .then(() => console.log(confirmations))
      .then(() => db.write())
      .then((msg) => console.log(msg))
  } else {
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
