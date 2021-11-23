import { SlashCommandBuilder, userMention } from "@discordjs/builders"
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js"

export const data = new SlashCommandBuilder()
  .setName("bulkban")
  .setDescription("Bulk ban users who joined between certain times")
  .setDefaultPermission(false)
  .addSubcommand((command) =>
    command
      .setName("users")
      .setDescription("Use users to calculate bulk ban")
      .addUserOption((option) =>
        option
          .setName("startuser")
          .setDescription("Starting user for bulk ban")
          .setRequired(true)
      )
      .addUserOption((option) =>
        option
          .setName("enduser")
          .setDescription("Ending user for bulk ban")
          .setRequired(true)
      )
  )
  .addSubcommand((command) =>
    command
      .setName("times")
      .setDescription("Use times to calculate bulk ban")
      .addIntegerOption((option) =>
        option
          .setName("starttime")
          .setDescription("Start time for bulk ban search (EPOCH milliseconds)")
          .setRequired(true)
      )
      .addIntegerOption((option) =>
        option
          .setName("endtime")
          .setDescription("End time for bulk ban search (EPOCH milliseconds)")
          .setRequired(true)
      )
  )

export async function execute(interaction) {
  const { confirmations, db } = await import("../index.js")

  const type = interaction.options.getSubcommand()
  var startTime
  var endTime

  return interaction
    .deferReply()
    .then(() => {
      if (type === "users") {
        startTime = interaction.options.getMember("startuser").joinedTimestamp
        endTime = interaction.options.getMember("enduser").joinedTimestamp
      } else {
        startTime = interaction.options.getInteger("starttime")
        endTime = interaction.options.getInteger("endtime")
      }

      // if times are in wrong order, swap them
      if (startTime > endTime) endTime = [startTime, (startTime = endTime)][0]
    })
    .then(() => interaction.guild.members.fetch({ force: true }))
    .then((allMembers) =>
      allMembers
        .filter(
          (member) =>
            member.joinedTimestamp >= startTime &&
            member.joinedTimestamp <= endTime
        )
        .sorted(
          (memberA, memberB) =>
            memberA.joinedTimestamp - memberB.joinedTimestamp
        )
    )
    .then((bannableMembers) =>
      interaction.editReply({
        embeds: [
          new MessageEmbed()
            .setTitle("Confirm Bulk Ban")
            .setColor("RED")
            .setDescription(
              `WARNING!!! CONFIRMING THIS WILL BAN ${bannableMembers.size} USERS!!!`
            )
            .addFields(
              { name: "User Amount", value: `${bannableMembers.size}` },
              {
                name: "First User",
                value: `${userMention(bannableMembers.first().id)}`,
                inline: true,
              },
              {
                name: "Last User",
                value: `${userMention(bannableMembers.last().id)}`,
                inline: true,
              }
            ),
        ],
        components: [
          new MessageActionRow().addComponents(
            new MessageButton()
              .setCustomId("ban-bulk")
              .setLabel("Ban All")
              .setStyle("DANGER"),
            new MessageButton()
              .setCustomId("cancel-bulk")
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
        times: {
          startTime,
          endTime,
        },
      })
    )
    .then(() => db.write())
}
