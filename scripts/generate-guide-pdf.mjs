import fs from "fs";
import path from "path";
import { mdToPdf } from "md-to-pdf";

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/generate-guide-pdf.mjs <input.md> <output.pdf>");
  process.exit(1);
}

const outputDir = path.dirname(outputPath);
fs.mkdirSync(outputDir, { recursive: true });

const pdf = await mdToPdf({ path: inputPath }, { dest: outputPath });

if (!pdf) {
  console.error("Failed to generate PDF.");
  process.exit(1);
}

if (!fs.existsSync(outputPath) && pdf.content) {
  fs.writeFileSync(outputPath, pdf.content);
}
