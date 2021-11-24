import unhomoglyph from "unhomoglyph"
import {
  banConfirmations,
  guildLogRef,
  importantUsers,
  membersNameChanged,
} from "../index.js"
import { globalExpCheck, importantUserCheck } from "../util/checks.js"
import { logToConsole } from "../util/logToConsole.js"
import { submitBan } from "../util/submitBan.js"

export async function usernameChangeListener(oldUser, newUser) {
  logToConsole(
    "userUpdate",
    `${newUser.id} | ${oldUser.username} -> ${newUser.username}`
  )
  // if username hasn't changed, the member update doesn't matter
  if (oldUser.username === newUser.username) return

  // if user is configured in importantUsers, skip function
  if (importantUsers.find((x) => x.id === newUser.id)) return

  // normalises new and old usernames
  const oldUsernameRef = oldUser.username
  const oldUsernameUn = unhomoglyph(oldUsernameRef)
  const newUsernameRef = newUser.username
  const newUsernameUn = unhomoglyph(newUsernameRef)

  /* REMOVED: if id matches an item in membersNameChanged, and there has been less than 5 minutes since last change, autoban user
  if (
    membersNameChanged.find(
      (x) => x.id === newUser.id && x.timeSet < Date.now() + 300000
    )
  )
    return submitBan(
      guildLogRef.guild.members.cache.get(newUser.id),
      `fast username change: \`${oldUsernameRef}\` -> \`${newUsernameRef}\``,
      "member username update",
      banConfirmations.usernameChange.fastChange
    ) */

  const importantUserMatched = await importantUserCheck(newUsernameUn)
  if (importantUserMatched)
    return submitBan(
      guildLogRef.guild.members.cache.get(newUser.id),
      `regex match: ${importantUserMatched}`,
      "member username update",
      banConfirmations.usernameChange.importantUserRegex
    )

  const globalExpMatched = await globalExpCheck(newUsernameUn)
  if (globalExpMatched)
    return submitBan(
      guildLogRef.guild.members.cache.get(newUser.id),
      `global match found for ${globalExpMatched.type} exp: ${globalExpMatched.checkExp}`,
      "member username update",
      banConfirmations.usernameChange.globalRegex
    )

  // keep membersNameChanged array at length of 1000
  if (membersNameChanged.length === 1000) membersNameChanged.shift()
  return membersNameChanged.push({ id: newUser.id, timeSet: Date.now() })
}
