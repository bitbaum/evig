import { createServer } from 'node:http';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import puppeteer from 'puppeteer';

// Exercise the runtime API crossed by the security upgrade, without delivery.
test('patched Nodemailer still generates the app SMTP message format locally', async () => {
  const transport = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: 'unix',
  });
  const result = await transport.sendMail({
    from: 'Example <sender@example.invalid>',
    to: 'recipient@example.invalid',
    subject: 'Synthetic account confirmation',
    text: 'Local compatibility fixture. No message leaves the test process.',
    html: '<p>Local compatibility fixture.</p>',
  });
  const message = result.message.toString();
  assert.match(message, /Subject: Synthetic account confirmation/);
  assert.match(message, /multipart\/alternative/);
  assert.deepEqual(result.envelope.to, ['recipient@example.invalid']);
  transport.close();
});

// Puppeteer's upstream update replaces chromium-bidi's vulnerable Zod 3 path.
// Drive BiDi itself, rather than proving only that the default CDP path starts.
test(
  'updated Puppeteer and BiDi schemas can navigate and evaluate in Chromium',
  { timeout: 60_000 },
  async () => {
    const server = createServer((_request, response) =>
      response.end('<h1>Compatibility fixture</h1>'),
    );
    await new Promise((done) => server.listen(0, '127.0.0.1', done));
    let browser;
    try {
      browser = await puppeteer.launch({
        protocol: 'webDriverBiDi',
        headless: true,
        ...(process.env.BROWSER_EXECUTABLE
          ? { executablePath: process.env.BROWSER_EXECUTABLE }
          : {}),
        args: ['--no-sandbox'],
      });
      const page = await browser.newPage();
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      assert.equal(
        await page.evaluate(() => document.querySelector('h1').textContent),
        'Compatibility fixture',
      );
      await page.close();
    } finally {
      await browser?.close();
      await new Promise((done) => server.close(done));
    }
  },
);

test('the publishing renderer still produces accessible math with patched KaTeX', async () => {
  const { renderMath } = await import('bip-kit/react');
  for (const tex of ['x^2 + y^2 = z^2', String.raw`\frac{1}{2}`, String.raw`\sum_{n=1}^{10} n`]) {
    const html = await renderMath(tex, true);
    assert.ok(html, 'Installed math peer must render instead of falling back silently');
    assert.match(html, /katex-mathml/);
    assert.match(html, /<math/);
  }
  const unsafe = await renderMath(String.raw`\href{javascript:alert(1)}{click}`, false);
  assert.ok(unsafe);
  assert.doesNotMatch(unsafe, /href=["']javascript:/);
});

test('patched diagram sanitizer keeps formatting and removes executable markup', async () => {
  const { createRequire } = await import('node:module');
  const { JSDOM } = await import('jsdom');
  const requireFromDiagram = createRequire(import.meta.resolve('mermaid'));
  const createDOMPurify = requireFromDiagram('dompurify');
  const dom = new JSDOM('');
  try {
    const sanitize = createDOMPurify(dom.window);
    const html = sanitize.sanitize(
      '<p><strong>Kept</strong><img src="x" onerror="alert(1)"></p><svg><a href="javascript:alert(1)">Unsafe link</a></svg>',
    );
    assert.match(html, /<strong>Kept<\/strong>/);
    assert.doesNotMatch(html, /onerror|javascript:/);
  } finally {
    dom.window.close();
  }
});
