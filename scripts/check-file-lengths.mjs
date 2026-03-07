import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_LINES = 450;
const ROOT = process.cwd();
const CODE_DIRECTORIES = ['src', 'tests', 'scripts'];
const ROOT_CODE_FILES = ['eslint.config.mjs', 'vitest.config.ts'];
const CODE_EXTENSIONS = new Set(['.ts', '.mjs']);

async function collectCodeFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectCodeFiles(fullPath);
      }

      if (entry.isFile() && CODE_EXTENSIONS.has(path.extname(entry.name))) {
        return [fullPath];
      }

      return [];
    }),
  );

  return nestedFiles.flat();
}

async function countLines(filePath) {
  const content = await readFile(filePath, 'utf8');

  if (content.length === 0) {
    return 0;
  }

  return content.split(/\r?\n/).length;
}

const nestedFiles = (
  await Promise.all(CODE_DIRECTORIES.map((directory) => collectCodeFiles(path.join(ROOT, directory))))
).flat();

const files = [...nestedFiles, ...ROOT_CODE_FILES.map((file) => path.join(ROOT, file))].sort();

const violations = [];

for (const filePath of files) {
  const lineCount = await countLines(filePath);

  if (lineCount > MAX_LINES) {
    violations.push({
      filePath: path.relative(ROOT, filePath),
      lineCount,
    });
  }
}

if (violations.length > 0) {
  console.error(`코드 파일 줄 수 제한(${MAX_LINES}줄)을 초과한 파일이 있습니다.`);

  for (const violation of violations) {
    console.error(`- ${violation.filePath}: ${violation.lineCount}줄`);
  }

  process.exit(1);
}

console.log(`코드 파일 줄 수 검사 통과 (${files.length}개 파일, 최대 ${MAX_LINES}줄)`);
