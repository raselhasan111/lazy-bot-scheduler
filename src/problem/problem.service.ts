import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

interface Problem {
  link: string;
  postedOn?: Date;
}

@Injectable()
export class ProblemService {
  private readonly logger = new Logger(ProblemService.name);
  private problems: Problem[] = [];
  private readonly historyFilePath: string;
  private readonly problemsFilePath: string;

  constructor(private configService: ConfigService) {
    this.problemsFilePath =
      this.configService.get('PROBLEMS_FILE_PATH') || 'problems.txt';
    this.historyFilePath =
      this.configService.get('HISTORY_FILE_PATH') || 'history.json';
    this.loadProblems();
  }

  private loadProblems() {
    try {
      // Load problems from text file
      const problemsData = fs.readFileSync(this.problemsFilePath, 'utf8');
      const problemLinks = problemsData
        .split('\n')
        .map((link) => link.trim())
        .filter((link) => link.length > 0);

      this.problems = problemLinks.map((link) => ({
        link,
      }));

      // Load history if exists
      if (fs.existsSync(this.historyFilePath)) {
        const historyData = JSON.parse(
          fs.readFileSync(this.historyFilePath, 'utf8'),
        ) as Problem[];

        if (Array.isArray(historyData)) {
          // Mark problems as posted based on history
          historyData.forEach((posted: Problem) => {
            const problem = this.problems.find((p) => p.link === posted.link);
            if (problem) {
              problem.postedOn = new Date(posted.postedOn as Date);
            }
          });
        }
      }

      this.logger.log(`Loaded ${this.problems.length} problems from file`);
    } catch (error) {
      this.logger.error(`Failed to load problems: ${error}`);
      this.problems = [];
    }
  }

  getNextProblem(): Problem | null {
    const unpostedProblems = this.problems.filter(
      (problem) => !problem.postedOn,
    );

    if (unpostedProblems.length === 0) {
      this.logger.warn('No unposted problems available');
      return null;
    }

    return unpostedProblems[0];
  }

  markAsSent(problem: Problem): void {
    const problemToUpdate = this.problems.find((p) => p.link === problem.link);

    if (problemToUpdate) {
      problemToUpdate.postedOn = new Date();

      // Update history file
      fs.writeFileSync(
        this.historyFilePath,
        JSON.stringify(
          this.problems.filter((p) => p.postedOn),
          null,
          2,
        ),
      );

      this.logger.log(`Marked problem ${problem.link} as posted`);
    }
  }
}
