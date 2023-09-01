import * as RAR from "fp-ts/ReadonlyArray";
import { LoremIpsum } from "lorem-ipsum";

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 5,
    min: 5,
  },
  wordsPerSentence: {
    max: 16,
    min: 4,
  },
});

export const DOCUMENTS = RAR.makeBy(100, (index) => ({
  id: index,
  title: "IN THE HIGH COURT OF ANDHRA PRADESH AT HYDERABAD",
  plaintiff: lorem.generateWords(4),
  defendant: lorem.generateWords(4),
  content: lorem.generateParagraphs(3),
}));

export const REASONS_FOR_PETITION = [
  {
    id: "AP-0880-2021",
    content:
      "Exceeding the age limit for open category candidates by one month and 18 days.",
  },
  {
    id: "AP-0880-2021",
    content:
      "Paper was unfairly evaluated, and requested reevaluation by a second examiner.",
  },
  {
    id: "AP-0880-2021",
    content:
      "Mistakes in translation of questions from English to Telugu in the prelims.",
  },
  {
    id: "AP-0880-2021",
    content:
      "Seeking appointment on compassionate grounds following the death of her father.",
  },
  {
    id: "AP-0880-2021",
    content:
      "Provision allowing 5-year age relaxation exclusively for Central/U.T. Government employees was unfair.",
  },
  {
    id: "AP-0880-2021",
    content:
      "Challenged the correctness of 19 answers and urged that answers be evaluated by the department of social works or medical colleges for an accurate assessment.",
  },
  {
    id: "AP-0880-2021",
    content:
      "Challenged the eligibility criteria and selection process outlined in the advertisement.",
  },
];
