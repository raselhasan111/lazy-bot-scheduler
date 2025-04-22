import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, IntentsBitField, TextChannel } from 'discord.js';

@Injectable()
export class DiscordService implements OnModuleInit {
  private readonly logger = new Logger(DiscordService.name);
  private client: Client;

  constructor(private configService: ConfigService) {
    this.client = new Client({
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
      ],
    });
  }

  async onModuleInit() {
    const token = this.configService.get<string>('DISCORD_BOT_TOKEN');

    if (!token) {
      this.logger.error(
        'DISCORD_BOT_TOKEN is not defined in environment variables',
      );
      return;
    }

    try {
      await this.client.login(token);
      this.logger.log('Discord bot is connected');

      this.client.on('ready', () => {
        this.logger.log(`Logged in as ${this.client.user?.tag}`);
      });
    } catch (error) {
      this.logger.error(`Failed to connect to Discord: ${error}`);
    }
  }

  async sendProblemChallenge(problemLink: string): Promise<boolean> {
    try {
      const channelId = this.configService.get<string>('DISCORD_CHANNEL_ID');

      if (!channelId) {
        this.logger.error(
          'DISCORD_CHANNEL_ID is not defined in environment variables',
        );
        return false;
      }

      const channel = (await this.client.channels.fetch(
        channelId,
      )) as TextChannel;

      if (!channel) {
        this.logger.error(`Channel with ID ${channelId} not found`);
        return false;
      }

      const message = `📝 **Daily Problem Challenge** 📝\n\nHere's today's problem to solve:\n${problemLink}\n\nHappy coding! Share your solutions in the thread.`;

      await channel.send(message);
      this.logger.log(
        `Successfully sent problem challenge to channel ${channelId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send problem challenge: ${error}`);
      return false;
    }
  }
}
