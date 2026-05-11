// Per-locale sample dataset fixtures. Selected at seed time based on the
// user's UI language; once seeded the entities live in the user's workspace
// and don't react to later language changes.
import en from "./sampleDataFixture.en.json";
import ru from "./sampleDataFixture.ru.json";
import de from "./sampleDataFixture.de.json";
import es from "./sampleDataFixture.es.json";

const datasets: Record<string, unknown> = { en, ru, de, es };

export function getSampleFixture(locale?: string): unknown {
  const key = (locale ?? "en").slice(0, 2).toLowerCase();
  return datasets[key] ?? datasets.en;
}
