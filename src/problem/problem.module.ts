import { Module } from '@nestjs/common';
import { ProblemService } from './problem.service';
import { DiscordService } from './discord.service';
import { ProblemScheduler } from './problem.scheduler';

@Module({
  providers: [ProblemService, DiscordService, ProblemScheduler],
})
export class ProblemModule {}
