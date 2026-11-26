import data from './chatbot-data.json';

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function replyTo(message: string) {
  const words = ` ${normalize(message)} `;
  let match: (typeof data.topics)[number] | undefined;
  let longest = 0;
  for (const topic of data.topics) {
    for (const phrase of [topic.label, ...topic.keywords]) {
      const key = normalize(phrase);
      if (key.length > longest && words.includes(` ${key} `)) {
        longest = key.length;
        match = topic;
      }
    }
  }
  return { answer: match?.answer ?? data.fallback, action: match?.action };
}
