import { Collection } from "discord.js"
import { confirmations } from "../index.js"
import { fetchBtnFiles } from "../util/fetchFiles.js"

export async function fetchSetButtons(client) {
  client.buttons = new Collection()
  return await fetchBtnFiles("buttons").then((fetchedBtns) =>
    fetchedBtns.forEach((btn) => client.buttons.set(btn.name, btn))
  )
}

export async function buttonListener(interaction) {
  const confirmationIndex = confirmations.findIndex(
    (x) => x.id === interaction.message.id
  )

  // if confirmation couldn't be found, return as the reaction isn't relevant
  if (confirmationIndex === -1) return

  const confirmation = confirmations[confirmationIndex]
  const hasBanPermissions = interaction.guild.members.cache
    .get(interaction.user.id)
    .permissions.has("BAN_MEMBERS")

  // user needs ban permissions as buttons can ban
  if (!hasBanPermissions) return

  // once all checks pass, send to correct button handler
  const category = interaction.customId.split("-")[0]
  const type = interaction.customId.split("-")[1]
  const button = interaction.client.buttons.get(category)
  try {
    return await button.execute(
      interaction,
      confirmation,
      confirmationIndex,
      type
    )
  } catch (error) {
    console.error(error)
    return await interaction.reply({
      content: "There was an error processing your interaction.",
      ephemeral: true,
    })
  }
}
