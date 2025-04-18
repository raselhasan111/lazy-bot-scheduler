import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProblemService } from './problem.service';
import { DiscordService } from './discord.service';

@Injectable()
export class ProblemScheduler {
  private readonly logger = new Logger(ProblemScheduler.name);

  constructor(
    private problemService: ProblemService,
    private discordService: DiscordService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE) // You can adjust this to your preferred time
  async handleDailyProblemPost() {
    this.logger.log('Executing scheduled job to post daily problem');

    try {
      const problem = this.problemService.getNextProblem();

      if (!problem) {
        this.logger.warn('No problems available to post');
        return;
      }

      const success = await this.discordService.sendProblemChallenge(
        problem.link,
      );

      if (success) {
        this.problemService.markAsSent(problem);
        this.logger.log(`Successfully posted problem: ${problem.link}`);
      }
    } catch (error) {
      this.logger.error(`Error in daily problem posting: ${error}`);
    }
  }
}
