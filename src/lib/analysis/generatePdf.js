import { existsSync } from 'fs';
import { renderAnalyticsReportHtml } from '@/lib/analysis/reportHtml';

const PDF_OPTS = {
  format: 'A4',
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
  preferCSSPageSize: true,
};

const DEV_CHROME_PATHS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
].filter(Boolean);

function resolveLocalChromePath() {
  for (const candidate of DEV_CHROME_PATHS) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  return null;
}

/** @returns {Promise<import('puppeteer-core').Browser>} */
async function launchBrowser() {
  const puppeteer = await import('puppeteer-core');
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    const executablePath = resolveLocalChromePath();
    if (!executablePath) {
      throw new Error(
        'Chrome not found for PDF export. Install Google Chrome or set PUPPETEER_EXECUTABLE_PATH in .env.local'
      );
    }
    return puppeteer.default.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  }

  const chromium = await import('@sparticuz/chromium');
  chromium.default.setGraphicsMode = false;

  return puppeteer.default.launch({
    args: chromium.default.args,
    defaultViewport: chromium.default.defaultViewport,
    executablePath: await chromium.default.executablePath(),
    headless: chromium.default.headless,
  });
}

/**
 * Render analytics report HTML to a PDF buffer via Puppeteer.
 * @param {Record<string, unknown>} payload
 * @returns {Promise<Buffer>}
 */
export async function generateAnalyticsPdf(payload) {
  const html = renderAnalyticsReportHtml(payload);
  let browser;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 45_000 });
    await page.emulateMediaType('print');

    const pdf = await page.pdf(PDF_OPTS);
    return Buffer.from(pdf);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
