import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const rootDir = path.resolve(process.cwd(), "public/images");
const supported = new Set([".png", ".jpg", ".jpeg"]);

function targetWidth(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.includes("/testimonials/")) return 520;
  if (normalized.includes("/brand/")) return 240;
  if (normalized.includes("/menu/")) return 1280;
  return 1600;
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(fullPath);
      return [fullPath];
    }),
  );
  return files.flat();
}

async function fileSize(filePath) {
  const stats = await fs.stat(filePath);
  return stats.size;
}

async function optimizeFile(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  if (!supported.has(ext)) return null;

  const outputPath = inputPath.replace(/\.(png|jpg|jpeg)$/i, ".webp");
  const width = targetWidth(inputPath);

  const image = sharp(inputPath, { failOn: "none" });
  const metadata = await image.metadata();

  const pipeline = image.rotate();
  if (metadata.width && metadata.width > width) {
    pipeline.resize({ width, withoutEnlargement: true });
  }

  await pipeline
    .webp({
      quality: 74,
      alphaQuality: 82,
      effort: 6,
      smartSubsample: true,
    })
    .toFile(outputPath);

  const [before, after] = await Promise.all([
    fileSize(inputPath),
    fileSize(outputPath),
  ]);

  await fs.unlink(inputPath);

  return {
    inputPath,
    outputPath,
    before,
    after,
  };
}

async function run() {
  const files = await walk(rootDir);
  const report = [];

  for (const filePath of files) {
    const result = await optimizeFile(filePath);
    if (result) report.push(result);
  }

  const beforeTotal = report.reduce((acc, item) => acc + item.before, 0);
  const afterTotal = report.reduce((acc, item) => acc + item.after, 0);
  const saved = beforeTotal - afterTotal;
  const ratio = beforeTotal > 0 ? (saved / beforeTotal) * 100 : 0;

  for (const item of report) {
    const relIn = path.relative(rootDir, item.inputPath).replace(/\\/g, "/");
    const relOut = path.relative(rootDir, item.outputPath).replace(/\\/g, "/");
    const beforeKb = (item.before / 1024).toFixed(1);
    const afterKb = (item.after / 1024).toFixed(1);
    console.log(`${relIn} -> ${relOut} | ${beforeKb}KB -> ${afterKb}KB`);
  }

  console.log("---");
  console.log(`Files optimized: ${report.length}`);
  console.log(`Total before: ${(beforeTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total after: ${(afterTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(
    `Saved: ${(saved / 1024 / 1024).toFixed(2)} MB (${ratio.toFixed(1)}%)`,
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
