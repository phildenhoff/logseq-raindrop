import type { IBatchBlock } from "@logseq/libs/dist/LSPlugin.user.js";
import { getOrCreateBlockInPage } from "@queries/getOrCreateBlockInPage.js";
import { getOrCreatePageByName } from "@queries/getOrCreatePage.js";
import type { LogseqServiceClient } from "@services/interfaces.js";
import { createCollectionUpdatedSinceGenerator } from "@services/raindrop/collection.js";
import { importFilterOptions } from "@util/settings.js";

export const importHighlightsSinceLastSync = async (
  lastSync: Date,
  logseqClient: LogseqServiceClient,
  pageName: string
) => {
  // get Raindrop page, or create it if it doesn't exist
  const page = await getOrCreatePageByName(logseqClient, pageName);
  if (page.isErr) {
    throw new Error(
      "Failed to import pages, could not create page to put highlights into"
    );
  }

  // Get the block under which we import the page, and underneath that, the
  // highlights. This generally looks like `# Articles`, and is one of the first
  // children of the page.
  const articleListParentBlock = await getOrCreateBlockInPage(
    logseqClient,
    page.value.uuid,
    (block) => block.content === "# Articles",
    "# Articles"
  );
  if (articleListParentBlock.isErr) {
    throw new Error(
      "Failed to import pages, could not create block to put highlights into"
    );
  }

  const generator = createCollectionUpdatedSinceGenerator(lastSync);

  // iterate over generator pages
  for await (const raindropListWindow of generator) {
    raindropListWindow.forEach(async (r) => {
      const importFilter = await logseqClient.settings.get("import_filter");
      if (importFilter === importFilterOptions.WITH_ANNOTATIONS) {
        if (r.annotations.length === 0) return;
      }

      const articleBlock = await logseqClient.createBlock(
        articleListParentBlock.value.uuid,
        `[${r.title}](${r.url})
        title:: ${r.title}
        url:: ${r.url}
        Tags:: ${r.tags.join(", ")}
        `,
        { sibling: false }
      );

      if (!articleBlock) {
        throw new Error(
          "Failed to import pages, could not create block to put highlights into"
        );
      }
      // Early return if the page doesn't have any highlights.
      if (r.annotations.length === 0) return;

      const highlightsBlock = await logseqClient.createBlock(
        articleBlock.uuid,
        `## Highlights`,
        { sibling: false, before: false }
      );
      if (!highlightsBlock) {
        throw new Error(
          "Failed to import pages, could not create block to put highlights into"
        );
      }

      // batch import highlights
      const highlightBatch = r.annotations.map(
        (a): IBatchBlock => ({
          content: [`> ${a.text}`, "", `${a.note}`].join("\n"),
        })
      );
      await logseqClient.createBlockBatch(
        highlightsBlock.uuid,
        highlightBatch,
        {
          before: true,
          sibling: false,
        }
      );
    });
  }
};
