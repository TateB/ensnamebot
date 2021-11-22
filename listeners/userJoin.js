import unhomoglyph from "unhomoglyph"
import { banConfirmations, importantUsers, membersJoined } from "../index.js"
import { globalExpCheck, importantUserCheck } from "../util/checks.js"
import { submitBan } from "../util/submitBan.js"

export async function userJoinListener(member) {
  // normalise username
  member.user.username = unhomoglyph(member.user.username)
  const { id } = member
  const username = member.user.username

  // if user is configured in importantUsers, skip function
  if (importantUsers.find((x) => x.id === id)) return

  // if in membersJoined there is a match in username, autoban user
  if (
    membersJoined.find((x) => x.user.username === username && x.user.id !== id)
  )
    return submitBan(
      member,
      "matched username in recent joins",
      "new user joined",
      banConfirmations.onJoin.recentDuplicate
    )

  const importantUserMatched = await importantUserCheck(username)
  if (importantUserMatched)
    return submitBan(
      member,
      `regex match: ${importantUserMatched}`,
      "new user joined",
      banConfirmations.onJoin.importantUserRegex
    )

  const globalExpMatched = await globalExpCheck(username)
  if (globalExpMatched)
    return submitBan(
      member,
      `global match found for ${globalExpMatched.type} exp: ${globalExpMatched.checkExp}`,
      "new user joined",
      banConfirmations.onJoin.globalRegex
    )

  // keep membersJoined array at length of 100
  if (membersJoined.length === 100) membersJoined.shift()
  return membersJoined.push(member)
}
