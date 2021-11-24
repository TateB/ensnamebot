import { SlashCommandBuilder } from "@discordjs/builders"

export const data = new SlashCommandBuilder()
  .setName("user")
  .setDescription("User settings")
  .setDefaultPermission(false)
