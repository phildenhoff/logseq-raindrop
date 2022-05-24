import type { PageEntity } from "@logseq/libs/dist/LSPlugin";
import type { ID } from "src/util/Raindrop";

export const findPagesByRaindropID = async (id: ID): Promise<PageEntity[]> =>
  await logseq.DB.q(`(page-property raindrop-id ${id})`);
