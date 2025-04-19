import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { ProblemScheduler } from './problem.scheduler';
import { GoogleSheetsService } from './google-sheets.service';

@Module({
  providers: [DiscordService, GoogleSheetsService, ProblemScheduler],
})
export class ProblemModule {}
