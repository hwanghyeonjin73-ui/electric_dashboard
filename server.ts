import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPSTREAM_BASE =
  'https://apis.data.go.kr/B552115/SmpWithForecastDemand/getSmpWithForecastDemand';

function extractXmlTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? match[1].trim() : null;
}

function parseXmlItems(xml: string): Record<string, string>[] {
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  return itemMatches.map((block) => {
    const record: Record<string, string> = {};
    const tagRegex = /<([a-zA-Z0-9_]+)>([^<]*)<\/\1>/g;
    let m: RegExpExecArray | null;
    while ((m = tagRegex.exec(block)) !== null) {
      record[m[1]] = m[2].trim();
    }
    return record;
  });
}

function getKstDateString(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.get('/api/smp-forecast-demand', async (req, res) => {
    const envPath = path.resolve(__dirname, '.env');
    let parsedEnv: Record<string, string> = {};
    if (fs.existsSync(envPath)) {
      try {
        parsedEnv = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
      } catch {
        parsedEnv = {};
      }
    }

    const candidates = [
      parsedEnv.KPX_API_KEY,
      parsedEnv.DATA_GO_KR_SERVICE_KEY,
      parsedEnv.SMP_API_KEY,
      parsedEnv.SERVICE_KEY,
      process.env.KPX_API_KEY,
      process.env.DATA_GO_KR_SERVICE_KEY,
      process.env.SMP_API_KEY,
      process.env.SERVICE_KEY,
    ];

    const rawKey =
      candidates
        .map((v) => (v ?? '').trim())
        .find(
          (v) =>
            v.length > 0 &&
            v !== 'MY_KPX_API_KEY' &&
            v !== 'MY_DATA_GO_KR_SERVICE_KEY'
        ) || '';

    if (!rawKey) {
      res.status(400).json({
        ok: false,
        errorCode: 'MISSING_API_KEY',
        message:
          '인증키가 설정되지 않았습니다. 프로젝트 루트의 .env 파일에서 KPX_API_KEY (또는 DATA_GO_KR_SERVICE_KEY) 값을 입력해 주세요.',
        detail:
          '현재 .env 파일의 KPX_API_KEY와 DATA_GO_KR_SERVICE_KEY 값이 비어 있습니다. 공공데이터포털 일반 인증키를 입력한 뒤 저장하고 다시 조회해 주세요.',
        endpoint: UPSTREAM_BASE,
      });
      return;
    }

    // Avoid double-encoding if the user pasted an already URL-encoded key from data.go.kr
    const encodedServiceKey = rawKey.includes('%')
      ? rawKey
      : encodeURIComponent(rawKey);

    const requestedDate =
      typeof req.query.date === 'string' && req.query.date.trim()
        ? req.query.date.replace(/-/g, '').trim()
        : getKstDateString();

    const numOfRows =
      typeof req.query.numOfRows === 'string' && /^\d+$/.test(req.query.numOfRows)
        ? req.query.numOfRows
        : '48';

    const queryParts = [
      `serviceKey=${encodedServiceKey}`,
      `pageNo=1`,
      `numOfRows=${numOfRows}`,
      `dataType=json`,
    ];

    if (requestedDate && requestedDate !== 'latest') {
      queryParts.push(`date=${encodeURIComponent(requestedDate)}`);
    }

    const requestUrl = `${UPSTREAM_BASE}?${queryParts.join('&')}`;

    try {
      const upstream = await fetch(requestUrl, {
        headers: {
          Accept: 'application/json, application/xml, text/xml;q=0.9, */*;q=0.8',
        },
        signal: AbortSignal.timeout(10000),
      });

      const rawText = await upstream.text();
      const trimmed = rawText.trim();

      if (!upstream.ok && !trimmed.startsWith('{') && !trimmed.startsWith('<')) {
        res.status(upstream.status).json({
          ok: false,
          errorCode: `HTTP_${upstream.status}`,
          message: `API 서버 응답 오류 (HTTP ${upstream.status})`,
          detail: trimmed || upstream.statusText,
          endpoint: UPSTREAM_BASE,
        });
        return;
      }

      // Handle XML response (data.go.kr frequently returns XML on auth/quota errors)
      if (trimmed.startsWith('<')) {
        const authMsg = extractXmlTag(trimmed, 'returnAuthMsg');
        const errMsg = extractXmlTag(trimmed, 'errMsg');
        const reasonCode = extractXmlTag(trimmed, 'returnReasonCode');
        const resultCode = extractXmlTag(trimmed, 'resultCode');
        const resultMsg = extractXmlTag(trimmed, 'resultMsg');

        if (
          authMsg ||
          errMsg ||
          (resultCode && resultCode !== '00') ||
          trimmed.includes('OpenAPI_ServiceResponse')
        ) {
          res.status(502).json({
            ok: false,
            errorCode: reasonCode || resultCode || 'OPENAPI_XML_ERROR',
            message:
              authMsg ||
              resultMsg ||
              errMsg ||
              '공공데이터포털 OpenAPI 인증 또는 요청 오류가 발생했습니다.',
            detail: trimmed,
            endpoint: UPSTREAM_BASE,
          });
          return;
        }

        const xmlItems = parseXmlItems(trimmed);
        res.json({
          ok: true,
          endpoint: UPSTREAM_BASE,
          requestedDate,
          requestedAt: new Date().toISOString(),
          totalCount: xmlItems.length,
          items: xmlItems,
        });
        return;
      }

      // Parse JSON response
      let json: Record<string, unknown>;
      try {
        json = JSON.parse(trimmed) as Record<string, unknown>;
      } catch {
        res.status(502).json({
          ok: false,
          errorCode: 'INVALID_JSON_RESPONSE',
          message: `API 응답을 JSON으로 해석하지 못했습니다 (HTTP ${upstream.status}).`,
          detail: trimmed.slice(0, 600),
          endpoint: UPSTREAM_BASE,
        });
        return;
      }

      const responseObj = json.response as
        | {
            header?: { resultCode?: string; resultMsg?: string };
            body?: {
              totalCount?: number;
              items?: { item?: unknown };
            };
          }
        | undefined;

      const resultCode = responseObj?.header?.resultCode;
      const resultMsg = responseObj?.header?.resultMsg;

      if (resultCode && resultCode !== '00') {
        res.status(502).json({
          ok: false,
          errorCode: resultCode,
          message: resultMsg || `API 처리 오류 (코드: ${resultCode})`,
          detail: JSON.stringify(responseObj?.header ?? json),
          endpoint: UPSTREAM_BASE,
        });
        return;
      }

      const rawItem = responseObj?.body?.items?.item;
      const items = Array.isArray(rawItem)
        ? rawItem
        : rawItem
        ? [rawItem]
        : [];

      res.json({
        ok: true,
        endpoint: UPSTREAM_BASE,
        requestedDate,
        requestedAt: new Date().toISOString(),
        totalCount: responseObj?.body?.totalCount ?? items.length,
        items,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 네트워크 오류가 발생했습니다.';
      res.status(502).json({
        ok: false,
        errorCode: 'FETCH_FAILED',
        message: '한국전력거래소 API 서버에 연결하지 못했습니다.',
        detail: errorMessage,
        endpoint: UPSTREAM_BASE,
      });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GridPulse server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
