import unhomoglyph from "unhomoglyph"
import {
  autoSweepTime,
  banConfirmations,
  client,
  guildId,
  importantUsers,
} from "../index.js"
import { globalExpCheck, importantUserCheck } from "./checks.js"
import { logToConsole } from "./logToConsole.js"
import { submitBan } from "./submitBan.js"

// interval using configured time to manual sweep, default is 5 minutes
export function startSweepInterval() {
  logToConsole("sweep", `Auto-sweep time set to ${autoSweepTime} minutes`)
  return setInterval(() => runSweep(), autoSweepTime * 1000 * 60)
}

// manual sweep, for if username change isn't caught by the listener for whatever reason
export async function runSweep() {
  logToConsole("sweep", "Running manual sweep")
  // get the guild, and wait for members to be fetched (using force to prevent cached data being used)
  const localGuild = client.guilds.cache.get(guildId)
  const members = await localGuild.members.fetch({ force: true })

  return Promise.all(
    members.map(async (member) => {
      // if member is an important user, don't submitban
      if (
        importantUsers.find((x) => x.id === member.id || x.id === member.userId)
      )
        return
      const normalisedUsername = unhomoglyph(member.user.username)
      const userCheck = await importantUserCheck(normalisedUsername)
      const globalCheck = await globalExpCheck(normalisedUsername)

      // if either usercheck or globalcheck returned a non-null result, submit a ban
      if (userCheck || globalCheck) {
        return submitBan(
          member,
          userCheck
            ? `regex match: ${userCheck}`
            : `global match: ${globalCheck.checkExp}`,
          "manual sweep",
          userCheck
            ? banConfirmations.manualSweep.importantUserRegex
            : banConfirmations.manualSweep.globalRegex
        )
      } else {
        return
      }
    })
  )
    .then(() => logToConsole("sweep", "Manual sweep complete"))
    .catch((err) =>
      logToConsole("sweep", `Manual sweep failed - ${err.message}`, true)
    )
}
