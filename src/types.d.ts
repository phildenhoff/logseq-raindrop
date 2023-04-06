export type ID = string;

export type Annotation = {
  note: string;
  color: HighlightsColor;
  text: string;
  created: Date;
  id: ID;
};

export type Tag = string;

export type Raindrop = {
  title: string;
  description: string;
  annotations: Annotation[];
  tags: Tag[];
  coverImage: string;
  created: Date;
  url: URL;
  collectionName?: string;
  id: ID;
};
