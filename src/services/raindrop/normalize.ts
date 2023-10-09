import type { Annotation, Raindrop } from "@types";

type HighlightsColor =
  | "blue"
  | "brown"
  | "cyan"
  | "gray"
  | "green"
  | "indigo"
  | "orange"
  | "pink"
  | "purple"
  | "red"
  | "teal"
  | "yellow";
export type RaindropResponse = {
  excerpt: string;
  note: string;
  type: "link" | "article" | "image" | "video" | "document" | "audio";
  cover: string;
  tags: string[];
  removed: boolean;
  _id: number;
  link: string;
  title: string;
  created: string;
  lastUpdate: string;
  media: [
    {
      link: string;
    }
  ];
  user: {
    $ref: "users";
    $id: number;
  };
  collection: {
    $ref: "collections";
    $id: number;
  };
  highlights: [
    {
      _id: string;
      text: string;
      color: HighlightsColor;
      note: string;
      created: string;
    }
  ];
  domain: string;
  creatorRef: {
    avatar: string;
    _id: number;
    name: string;
    email: string;
  };
  sort: number;
  cache: {
    status:
      | "ready"
      | "retry"
      | "failed"
      | "invalid-origin"
      | "invalid-timeout"
      | "invalid-size";
    size: number;
    created: string;
  };
  collectionId: number;
};

export const normalizeApiRaindrop = (r: RaindropResponse): Raindrop => {
  const annotations = r.highlights.map(
    (item): Annotation => ({
      note: item.note,
      created: new Date(item.created),
      color: item.color,
      text: item.text,
      id: item._id,
    })
  );

  return {
    id: r._id.toString(),
    title: r.title,
    note: r.note,
    description: r.excerpt,
    coverImage: r.cover,
    url: new URL(r.link),
    created: new Date(r.created),
    lastUpdate: new Date(r.lastUpdate),
    tags: r.tags,
    annotations,
  };
};
