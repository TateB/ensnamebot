import { SlashCommandBuilder } from "@discordjs/builders"

export const data = new SlashCommandBuilder()
  .setName("global")
  .setDescription("Global settings")
  .setDefaultPermission(false)
