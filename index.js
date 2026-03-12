// index.js - main bot file

import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import radioCommand from './commands.js';
import * as config from './config.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.commands = new Collection();
client.commands.set(radioCommand.data.name, radioCommand);

// v15+ change: use 'clientReady'
client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('Error executing command:', error);
    // Use try/catch because interaction might have already been replied/deferred
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
      } else {
        await interaction.editReply('There was an error executing this command!');
      }
    } catch {}
  }
});

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(config.TOKEN);
  try {
    console.log('Registering commands...');
    await rest.put(
      Routes.applicationGuildCommands(config.APPLICATION_ID, config.SERVER_ID),
      { body: [radioCommand.data.toJSON()] }
    );
    console.log('Commands registered.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

await registerCommands();
client.login(config.TOKEN);
