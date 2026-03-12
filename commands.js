// commands.js
import { SlashCommandBuilder } from 'discord.js';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus,
  getVoiceConnection
} from '@discordjs/voice';
import { RADIO_CHANNEL_ID, RADIO_URL } from './config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription('Play radio in the configured voice channel!'),

  async execute(interaction) {
    console.log('================ RADIO COMMAND START ================');
    console.log('[Radio] Command executed by:', interaction.user.tag);
    console.log('[Radio] Guild ID:', interaction.guild?.id);

    // Defer reply
    try {
      if (!interaction.deferred && !interaction.replied) {
        console.log('[Radio] Deferring reply...');
        await interaction.deferReply();
      }
    } catch (error) {
      console.warn('[Radio] Defer failed:', error.message);
    }

    console.log('[Radio] Looking for channel ID:', RADIO_CHANNEL_ID);
    const channel = interaction.guild.channels.cache.get(RADIO_CHANNEL_ID);

    console.log('[Radio] Channel found:', !!channel);
    if (channel) {
      console.log('[Radio] Channel name:', channel.name);
      console.log('[Radio] Is voice based:', channel.isVoiceBased());
    }

    if (!channel || !channel.isVoiceBased()) {
      console.log('[Radio] ❌ Invalid or missing voice channel');
      try { await interaction.editReply('❌ Radio channel not found or invalid!'); } catch {}
      return;
    }

    let connection = getVoiceConnection(interaction.guild.id);
    console.log('[Radio] Existing voice connection:', !!connection);

    if (connection) {
      console.log('[Radio] Existing connection channel ID:', connection.joinConfig.channelId);
    }

    if (connection && connection.joinConfig.channelId !== RADIO_CHANNEL_ID) {
      console.log('[Radio] Destroying old connection...');
      connection.destroy();
      connection = null;
    }

    if (!connection) {
      console.log('[Radio] Joining voice channel...');
      try {
        connection = joinVoiceChannel({
          channelId: RADIO_CHANNEL_ID,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator
        });

        console.log('[Radio] Waiting for VoiceConnection READY...');
        await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
        console.log('[Radio] ✅ Voice connection READY');
      } catch (error) {
        console.error('[Radio] ❌ Voice connection failed:', error);
        try { await interaction.editReply('❌ Failed to join voice channel'); } catch {}
        return;
      }
    }

    console.log('[Radio] Creating audio player...');
    try {
      const player = createAudioPlayer();

      console.log('[Radio] Creating audio resource from URL:');
      console.log('[Radio] RADIO_URL:', RADIO_URL);

      const resource = createAudioResource(RADIO_URL);

      console.log('[Radio] Starting playback...');
      player.play(resource);
      connection.subscribe(player);

      player.once(AudioPlayerStatus.Playing, () => {
        console.log('[Radio] ✅ AudioPlayerStatus: PLAYING');
      });

      player.on('error', (error) => {
        console.error('[Radio] ❌ Audio player error:', error);
      });

      player.on(AudioPlayerStatus.Idle, () => {
        console.warn('[Radio] ⚠️ Audio player IDLE');
      });

      try { await interaction.editReply('🎶 Now playing the radio!'); } catch {}
    } catch (error) {
      console.error('[Radio] ❌ Failed to create/play audio:', error);
      try { await interaction.editReply('❌ Failed to play radio.'); } catch {}
    }

    console.log('================ RADIO COMMAND END ==================');
  }
};
