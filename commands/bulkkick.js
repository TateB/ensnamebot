import { SlashCommandBuilder, userMention } from "@discordjs/builders"
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js"

export const data = new SlashCommandBuilder()
  .setName("bulkkick")
  .setDescription("Bulk kick users with no role")
  .setDefaultPermission(false)
  .addIntegerOption((option) =>
    option
      .setName("graceperiod")
      .setDescription("Grace period for no role users, in days [Default: 7]")
  )

export async function execute(interaction) {
  const { confirmations, db } = await import("../index.js")

  const gracePeriod = interaction.options.get("graceperiod") || { value: 7 }
  // calculate the maxmimum joinedTimestamp for the query
  const upToJoinedTime = Date.now() - gracePeriod.value * 24 * 60 * 60 * 1000
  const everyoneRole = interaction.guild.roles.everyone.id

  return (
    interaction
      .deferReply()
      .then(() => interaction.guild.members.fetch({ force: true }))
      // filter to users who joined before the grace period, and don't have a role, and sort by joinedTimestamp
      .then((allMembers) =>
        allMembers
          .filter(
            (member) =>
              member.joinedTimestamp < upToJoinedTime &&
              member.roles.highest.id === everyoneRole
          )
          .sorted(
            (memberA, memberB) =>
              memberA.joinedTimestamp - memberB.joinedTimestamp
          )
      )
      .then((noRoleMembers) => {
        return noRoleMembers.size
          ? noRoleMembers
          : Promise.reject({ message: "No users to kick." })
      })
      .then((noRoleMembers) =>
        interaction.editReply({
          embeds: [
            new MessageEmbed()
              .setTitle("Confirm Bulk Kick")
              .setColor("RED")
              .setDescription(
                `WARNING!!! CONFIRMING THIS WILL KICK ${noRoleMembers.size} USERS!!!`
              )
              .addFields(
                { name: "User Amount", value: `${noRoleMembers.size}` },
                {
                  name: "First User",
                  value: `${userMention(noRoleMembers.first().id)}`,
                  inline: true,
                },
                {
                  name: "Last User",
                  value: `${userMention(noRoleMembers.last().id)}`,
                  inline: true,
                },
                {
                  name: "Random Users",
                  value: `${userMention(
                    noRoleMembers.random().id
                  )}, ${userMention(noRoleMembers.random().id)}, ${userMention(
                    noRoleMembers.random().id
                  )}`,
                }
              ),
          ],
          components: [
            new MessageActionRow().addComponents(
              new MessageButton()
                .setCustomId("bulkkick-kickall")
                .setLabel("Kick All")
                .setStyle("DANGER"),
              new MessageButton()
                .setCustomId("bulkkick-cancel")
                .setLabel("Cancel")
                .setStyle("SUCCESS")
            ),
          ],
        })
      )
      .then((message) =>
        confirmations.push({
          id: message.id,
          type: "request-bulk",
          upToJoinedTime: upToJoinedTime,
        })
      )
      .then(() => db.write())
      .catch((error) =>
        interaction.editReply("There was an error: " + error.message)
      )
  )
}
