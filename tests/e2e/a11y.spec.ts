import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { gotoAndReady } from './fixtures/helpers';

/**
 * a11y.spec.ts — accessibility smoke over the key public pages using axe-core (WCAG 2.0/2.1 A/AA).
 *
 * The bar is "no CRITICAL violations": critical issues (missing form labels, non-unique landmarks,
 * severe contrast, etc.) block real users, while the full violation list is attached to every run for
 * triage of lower-severity findings without failing the build.
 */
const PAGES = [
  { name: 'home', url: '/' },
  { name: 'shop', url: '/shop' },
  { name: 'restaurants', url: '/restaurants' },
  { name: 'support', url: '/support' },
];

for (const { name, url } of PAGES) {
  test(`a11y: ${name} has no critical accessibility violations`, async ({ page }, testInfo) => {
    await gotoAndReady(page, url);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Attach the full violation set so non-critical issues are visible even on a green run.
    await testInfo.attach('axe-violations.json', {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });

    const critical = results.violations.filter(v => v.impact === 'critical');
    const detail = critical.map(v => `${v.id} (${v.nodes.length}×): ${v.help}`).join('\n');
    expect(critical, `Critical a11y violations on ${url}:\n${detail}`).toEqual([]);
  });
}
