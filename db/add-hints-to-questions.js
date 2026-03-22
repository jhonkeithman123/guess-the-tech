// Enhance generated-questions.json by adding a hint for each question
import fs from "fs";

const questions = JSON.parse(
  fs.readFileSync("db/generated-questions.json", "utf-8"),
);

for (const q of questions) {
  // Simple hint: use the category and the first letter of the answer
  q.hint = `Category: ${q.category}. Starts with '${q.answer[0]}'.`;
}

fs.writeFileSync(
  "db/generated-questions.json",
  JSON.stringify(questions, null, 2),
);
console.log("Hints added to questions.");
