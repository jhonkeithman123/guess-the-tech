// This script scans the public folder for categories and images, then generates questions for each image.
import fs from "fs";
import path from "path";

const publicDir = path.join("public");
const categories = fs
  .readdirSync(publicDir)
  .filter((f) => fs.statSync(path.join(publicDir, f)).isDirectory());

const questions = [];

for (const category of categories) {
  const catDir = path.join(publicDir, category);
  const images = fs
    .readdirSync(catDir)
    .filter(
      (f) => f.endsWith(".svg") || f.endsWith(".png") || f.endsWith(".jpg"),
    );
  for (const img of images) {
    const name = img
      .replace(/\.(svg|png|jpg)$/i, "")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    questions.push({
      question: `Which technology does this logo represent?`,
      image: `/` + path.join(category, img).replace(/\\/g, "/"),
      answer: name,
      category,
      choices: [], // To be filled with distractors later
    });
  }
}

fs.writeFileSync(
  "db/generated-questions.json",
  JSON.stringify(questions, null, 2),
);
console.log("Generated questions for images:", questions.length);
