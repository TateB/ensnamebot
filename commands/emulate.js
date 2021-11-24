import { SlashCommandBuilder } from "@discordjs/builders"

export const data = new SlashCommandBuilder()
  .setName("emulate")
  .setDescription("Emulate an autoban or ban request")
  .setDefaultPermission(false)
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("User to emulate ban for")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("type")
      .setDescription("Ban type")
      .addChoices([
        ["Autoban", "autoban"],
        ["Ban Request", "request"],
      ])
      .setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("Reason for ban").setRequired(true)
  )

export async function execute(interaction) {
  const { submitBan } = await import("../util/submitBan.js")

  const user = interaction.options.getUser("user")
  const type = interaction.options.get("type").value
  const reason = interaction.options.get("reason").value

  submitBan(
    interaction.guild.members.cache.get(user.id),
    reason,
    "emulation",
    type === "autoban" ? false : true
  )
  return interaction.reply({ content: "Emulating ban...", ephemeral: true })
}
