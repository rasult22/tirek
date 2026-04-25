const UTF8_BOM = '﻿';

export function csvRow(cells: Array<string | number | null | undefined>): string {
  return cells
    .map((cell) => {
      const str = cell == null ? '' : String(cell);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(',');
}

export function csvFile(rows: string[]): string {
  return UTF8_BOM + rows.join('\r\n');
}
