// Add 4 choices to each question: 1 correct, 3 random distractors from other answers
import fs from "fs";

const questions = JSON.parse(
  fs.readFileSync("db/generated-questions.json", "utf-8"),
);
const allAnswers = questions.map((q) => q.answer);

function getRandomChoices(correct, all) {
  const pool = all.filter((a) => a !== correct);
  const shuffled = pool.sort(() => 0.5 - Math.random());
  const distractors = shuffled.slice(0, 3);
  const choices = [correct, ...distractors].sort(() => 0.5 - Math.random());
  return choices;
}

for (const q of questions) {
  q.choices = getRandomChoices(q.answer, allAnswers);
}

fs.writeFileSync(
  "db/generated-questions.json",
  JSON.stringify(questions, null, 2),
);
console.log("Choices added to questions.");
