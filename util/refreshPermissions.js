import { client, clientId, guildId, permittedRoleIds } from "../index.js"
import { logToConsole } from "./logToConsole.js"

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
    .then(() => logToConsole("permissions", "Permissions refreshed and set"))
    .catch((err) =>
      logToConsole(
        "permissions",
        `Failed to refresh permissions - ${err.message}`,
        true
      )
    )
}
