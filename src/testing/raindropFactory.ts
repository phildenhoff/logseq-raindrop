import type { Annotation, Raindrop } from "@types";
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
