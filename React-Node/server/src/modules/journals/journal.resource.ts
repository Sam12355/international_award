export interface JournalResourceOutput {
  id: number;
  name: string;
  issn: string;
}

export function toJournalResource(journal: {
  id: number;
  name: string;
  issn: string;
}): JournalResourceOutput {
  return {
    id: journal.id,
    name: journal.name,
    issn: journal.issn,
  };
}
