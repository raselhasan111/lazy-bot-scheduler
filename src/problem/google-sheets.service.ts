import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleSheetsService {
  private sheets;
  private sheetId: string;
  private defaultSheet: string = 'Sheet1'; // You can change this if needed

  constructor(private configService: ConfigService) {
    const clientEmail = this.configService.get<string>('GOOGLE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.sheetId = this.configService.get<string>('GOOGLE_SHEET_ID') ?? '';
  }

  /**
   * Convert column number to letter, e.g. 1 => A, 2 => B, 27 => AA
   */
  private getA1Notation(row: number, col: number): string {
    let colLetter = '';
    while (col > 0) {
      const rem = (col - 1) % 26;
      colLetter = String.fromCharCode(65 + rem) + colLetter;
      col = Math.floor((col - 1) / 26);
    }
    return `${this.defaultSheet}!${colLetter}${row}`;
  }

  /**
   * Reads the value from a specific cell by row and column.
   */
  async readCellByRowCol(row: number, col: number): Promise<string> {
    const range = this.getA1Notation(row, col);
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.sheetId,
      range,
    });

    return res.data.values?.[0]?.[0] ?? '';
  }

  /**
   * Writes a string value to a specific cell by row and column.
   */
  async writeCellByRowCol(row: number, col: number, value: string): Promise<void> {
    const range = this.getA1Notation(row, col);
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[value]],
      },
    });
  }
}
