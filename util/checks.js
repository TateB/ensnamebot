import { globalChecks, importantUsers } from "../index.js"

// check for regex match with importantUsers
export function importantUserCheck(username) {
  return new Promise((resolve, reject) => {
    importantUsers.forEach((importantUser) => {
      const regex = new RegExp(importantUser.checkExp, "i")
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
          if (username.toLowerCase() === checkExp.toLowerCase())
            resolve(checkEntry)
          break
        }
        case "contains": {
          if (username.toLowerCase().includes(checkExp.toLowerCase()))
            resolve(checkEntry)
          break
        }
        default:
          break
      }
    })
    resolve(false)
  })
}
