import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DiscordService } from './discord.service';
import { GoogleSheetsService } from 'src/problem/google-sheets.service';

@Injectable()
export class ProblemScheduler {
  private readonly logger = new Logger(ProblemScheduler.name);

  constructor(
    private discordService: DiscordService,
    private googelSheetsService: GoogleSheetsService
  ) {}

 @Cron(CronExpression.EVERY_DAY_AT_2AM)
 async handleDailyProblemPostFromSheet() {
  this.logger.log('Executing scheduled job to post daily problem from Google Sheets');

  try {
    // Step 1: Fetch the latest row number from cell E1 (row 1, column 5)
    const currentRow = await this.googelSheetsService.readCellByRowCol(1, 5);
    if (!currentRow) {
      this.logger.error('Could not fetch current row number from Google Sheets');
      return;
    }

    const rowNumber = parseInt(currentRow);

    // Step 2: Fetch the problem link from column A of the current row
    const problemLink = await this.googelSheetsService.readCellByRowCol(rowNumber, 1);
    if (!problemLink) {
      this.logger.error(`No problem link found in row ${rowNumber}`);
      return;
    }

    // Step 3: Post to Discord
    const success = await this.discordService.sendProblemChallenge(problemLink);
    if (!success) {
      this.logger.error('Failed to post problem to Discord');
      return;
    }

    // Step 4: Mark as DONE in column C of the current row
    await this.googelSheetsService.writeCellByRowCol(rowNumber, 3, 'DONE');

    // Step 5: Increment the row counter in cell E1
    const nextRow = rowNumber + 1;
    await this.googelSheetsService.writeCellByRowCol(1, 5, nextRow.toString());

    this.logger.log(`Successfully posted problem from row ${rowNumber}`);
  } catch (error) {
    this.logger.error(`Error in daily problem posting from sheet: ${error}`);
  }
}
}
