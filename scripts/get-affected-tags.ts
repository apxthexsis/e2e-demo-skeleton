/**
 * Computes which E2E tags are affected by the current git diff and prints a
 * Playwright --grep pattern, so CI only runs relevant tests.
 *
 * Usage:
 *   node scripts/get-affected-tags.ts <baseRef> [--ci]
 *
 * With --ci, component tags must co-occur with @ci on the test
 * (special tags @ci and @app-health-check match on their own).
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type TagMapping = {
  mappings: Record<string, string[]>;
  alwaysRunTags: string[];
};

const SPECIAL_TAGS = new Set(['@ci', '@app-health-check']);

const getChangedFiles = (baseRef: string): string[] => {
  const output = execSync(
    `git diff --name-only --diff-filter=ACMR ${baseRef}...HEAD`,
    {
      encoding: 'utf8'
    }
  );
  return output.split('\n').filter(Boolean);
};

const loadTagMapping = (): TagMapping => {
  const mappingPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'e2e',
    'tag-mapping.json'
  );
  return JSON.parse(readFileSync(mappingPath, 'utf8')) as TagMapping;
};

const findTagsForFile = (filePath: string, mapping: TagMapping): string[] =>
  Object.entries(mapping.mappings)
    .filter(([prefix]) => filePath.startsWith(prefix))
    .flatMap(([, tags]) => tags);

const escapeForRegex = (tag: string): string => tag.replace('@', '@');

export const buildGrepPattern = (
  tags: Set<string>,
  combineWithCi: boolean
): string => {
  const special = [...tags].filter(tag => SPECIAL_TAGS.has(tag));
  const components = [...tags].filter(tag => !SPECIAL_TAGS.has(tag));

  const patterns: string[] = special.map(escapeForRegex);

  if (components.length > 0) {
    const componentPattern = components.map(escapeForRegex).join('|');
    if (combineWithCi) {
      patterns.push(`((${componentPattern}).*@ci|@ci.*(${componentPattern}))`);
    } else {
      patterns.push(componentPattern);
    }
  }

  return patterns.join('|');
};

const main = () => {
  const [baseRef = 'origin/main', ...flags] = process.argv.slice(2);
  const combineWithCi = flags.includes('--ci');

  const mapping = loadTagMapping();
  const tags = new Set<string>(mapping.alwaysRunTags);

  for (const file of getChangedFiles(baseRef)) {
    for (const tag of findTagsForFile(file, mapping)) tags.add(tag);
  }

  process.stdout.write(buildGrepPattern(tags, combineWithCi));
};

main();
