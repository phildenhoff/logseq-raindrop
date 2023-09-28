import type { Annotation, Raindrop } from "@types";
import type { RaindropResponse } from "@services/raindrop/normalize.js";
import { randomUUID } from "crypto";

const generateAnnotation = (opts?: Partial<Annotation>): Annotation => ({
  note: opts?.note ?? randomUUID(),
  color: opts?.color ?? "blue",
  text: opts?.text ?? randomUUID(),
  created: opts?.created ?? new Date(),
  id: opts?.id ?? randomUUID(),
  ...opts,
});

const runRandomNumberOfTimes = (generator: () => Annotation) => {
  const numberOfTimes = Math.random() * 5;
  const returnable = [];

  for (let i = 0; i < numberOfTimes; i++) {
    returnable.push(generator());
  }

  return returnable;
};

export const generateRaindropResponse = (
  opts?: Partial<RaindropResponse>
): RaindropResponse => {
  return {
    _id: opts?._id ?? Math.random() * 10000,
    link: opts?.link ?? `https://www.${randomUUID()}.com`,
    title: opts?.title ?? randomUUID(),
    created: opts?.created ?? new Date().toISOString(),
    lastUpdate: opts?.lastUpdate ?? new Date().toISOString(),
    media: opts?.media ?? ([] as unknown as [{ link: string }]),
    user: opts?.user ?? ({} as RaindropResponse["user"]),
    collection: opts?.collection ?? ({} as RaindropResponse["collection"]),
    highlights:
      opts?.highlights ?? ([] as unknown as RaindropResponse["highlights"]),
    domain: opts?.domain ?? randomUUID(),
    creatorRef: opts?.creatorRef ?? ({} as RaindropResponse["creatorRef"]),
    sort: opts?.sort ?? 0,
    cache: opts?.cache ?? {
      status: "ready",
      size: 0,
      created: new Date().toISOString(),
    },
    collectionId: opts?.collectionId ?? 0,
    excerpt: opts?.excerpt ?? randomUUID(),
    note: opts?.note ?? randomUUID(),
    type: opts?.type ?? "link",
    cover: opts?.cover ?? randomUUID(),
    tags: opts?.tags ?? [],
    removed: opts?.removed ?? false,
  };
};

export const generateRaindrop = (opts?: Partial<Raindrop>): Raindrop => {
  return {
    title: opts?.title ?? randomUUID(),
    description: opts?.description ?? randomUUID(),
    annotations:
      opts?.annotations ?? runRandomNumberOfTimes(generateAnnotation),
    tags: opts?.tags ?? [],
    coverImage: opts?.coverImage ?? randomUUID(),
    created: opts?.created ?? new Date(),
    lastUpdate: opts?.lastUpdate ?? new Date(),
    url: opts?.url ?? new URL("https://example.com"),
    id: opts?.id ?? randomUUID(),
  };
};
