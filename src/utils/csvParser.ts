import { DailyHourlyCsvRow, MonthlySmpCsvRow } from '../types/market';

/**
 * Decodes an ArrayBuffer as UTF-8 or EUC-KR depending on content.
 * KPX downloads typically use EUC-KR / CP949 encoding.
 */
export function decodeCsvBuffer(buffer: ArrayBuffer): string {
  const utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  // Check for replacement characters or known Korean headers
  const hasReplacementChar = utf8Text.includes('\uFFFD');
  const hasKnownKoreanHeader =
    utf8Text.includes('날짜') ||
    utf8Text.includes('기간') ||
    utf8Text.includes('육지') ||
    utf8Text.includes('1시');

  if (!hasReplacementChar && hasKnownKoreanHeader) {
    return utf8Text.replace(/^\uFEFF/, '');
  }

  try {
    const eucKrText = new TextDecoder('euc-kr').decode(buffer);
    return eucKrText.replace(/^\uFEFF/, '');
  } catch {
    return utf8Text.replace(/^\uFEFF/, '');
  }
}

function splitCsvLine(line: string, delimiter: ',' | '\t' | 'whitespace'): string[] {
  if (delimiter === '\t') {
    return line.split('\t').map((c) => c.trim().replace(/^"|"$/g, ''));
  }
  if (delimiter === 'whitespace') {
    return line.trim().split(/\s+/).map((c) => c.trim().replace(/^"|"$/g, ''));
  }
  return line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
}

function detectDelimiter(headerLine: string): ',' | '\t' | 'whitespace' {
  if (headerLine.includes(',')) return ',';
  if (headerLine.includes('\t')) return '\t';
  return 'whitespace';
}

export interface ParsedCsvResult {
  kind: 'daily-hourly' | 'monthly-kpx';
  fileName: string;
  dailyRows: DailyHourlyCsvRow[];
  monthlyRows: MonthlySmpCsvRow[];
}

/**
 * Parses either:
 * 1) KPX Daily Hourly SMP CSV:
 *    Header: 날짜 1시 2시 3시 ... 24시 (comma, tab, or space separated)
 * 2) KPX Monthly SMP CSV (like attached HOME________________SMP_90d0ffe3.csv):
 *    Header row 1: 기간,SMP,,,BLMP
 *    Header row 2: ,육지,제주,통합,
 *    Data rows: 2026/09,119.02,118.97,119.02,0
 */
export function parseKpxCsvText(rawText: string, fileName: string): ParsedCsvResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error('CSV 파일에 데이터가 충분하지 않습니다.');
  }

  const firstLine = lines[0];
  const delimiter = detectDelimiter(firstLine);
  const firstCols = splitCsvLine(firstLine, delimiter);

  // Case 1: Daily Hourly SMP format (날짜 1시 2시 ... 24시)
  const isDailyHourly =
    firstCols.some((c) => c.includes('날짜') || c.toLowerCase() === 'date') &&
    firstCols.some((c) => c === '1시' || c === '01시' || c === '1');

  if (isDailyHourly) {
    const hourColIndices: number[] = [];
    for (let h = 1; h <= 24; h++) {
      const idx = firstCols.findIndex(
        (c) =>
          c === `${h}시` ||
          c === `${String(h).padStart(2, '0')}시` ||
          c === `${h}` ||
          c === `${String(h).padStart(2, '0')}:00`
      );
      hourColIndices.push(idx);
    }

    const dateIdx = firstCols.findIndex((c) => c.includes('날짜') || c.toLowerCase() === 'date');
    const dailyRows: DailyHourlyCsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = splitCsvLine(lines[i], delimiter);
      const rawDate = cols[dateIdx >= 0 ? dateIdx : 0];
      if (!rawDate) continue;

      const hours: number[] = [];
      for (let h = 0; h < 24; h++) {
        const colIdx = hourColIndices[h];
        const fallbackIdx = colIdx >= 0 ? colIdx : h + 1;
        const val = parseFloat((cols[fallbackIdx] ?? '').replace(/,/g, ''));
        hours.push(Number.isFinite(val) ? val : 0);
      }

      const validHours = hours.filter((v) => v > 0);
      const avg =
        validHours.length > 0
          ? validHours.reduce((a, b) => a + b, 0) / validHours.length
          : 0;
      const max = hours.length > 0 ? Math.max(...hours) : 0;
      const min = validHours.length > 0 ? Math.min(...validHours) : 0;

      dailyRows.push({
        date: rawDate,
        hours,
        avg: Number(avg.toFixed(2)),
        max: Number(max.toFixed(2)),
        min: Number(min.toFixed(2)),
      });
    }

    if (dailyRows.length === 0) {
      throw new Error('일별 시간별 SMP 행을 파싱하지 못했습니다.');
    }

    // Sort newest first if dates are parseable
    dailyRows.sort((a, b) => b.date.localeCompare(a.date));

    return {
      kind: 'daily-hourly',
      fileName,
      dailyRows,
      monthlyRows: [],
    };
  }

  // Case 2: Attached KPX Monthly SMP CSV (기간,SMP,,,BLMP)
  const monthlyRows: MonthlySmpCsvRow[] = [];
  for (let i = 0; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], ',');
    const period = cols[0] ?? '';
    if (!/^\d{4}[/-]\d{2}$/.test(period)) continue;

    const mainland = parseFloat(cols[1] ?? '0') || 0;
    const jeju = parseFloat(cols[2] ?? '0') || 0;
    const integrated = parseFloat(cols[3] ?? '0') || 0;
    const blmp = parseFloat(cols[4] ?? '0') || 0;

    monthlyRows.push({
      period,
      mainland: Number(mainland.toFixed(2)),
      jeju: Number(jeju.toFixed(2)),
      integrated: Number(integrated.toFixed(2)),
      blmp: Number(blmp.toFixed(2)),
    });
  }

  if (monthlyRows.length === 0) {
    throw new Error(
      '지원되지 않는 CSV 형식입니다. 첫 줄 열 이름이 "날짜 1시 2시 ... 24시" 또는 KPX 기간별 SMP 형식이어야 합니다.'
    );
  }

  // Keep chronological newest-first order
  monthlyRows.sort((a, b) => b.period.localeCompare(a.period));

  return {
    kind: 'monthly-kpx',
    fileName,
    dailyRows: [],
    monthlyRows,
  };
}
