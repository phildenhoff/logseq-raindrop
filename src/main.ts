import '@logseq/libs'
import App from './App.svelte'

const main = () => {
  console.log('main');
  // new App({
  //   target: document.getElementById('app')
  // })

  logseq.provideModel({
    async startPomoTimer (e: any) {
      const { pomoId, slotId, blockUuid } = e.dataset
      const startTime = Date.now()

      const block = await logseq.Editor.getBlock(blockUuid)
      const flag = `{{renderer :pomodoro_${pomoId}`
      const newContent = block?.content?.replace(`${flag}}}`,
        `${flag},${startTime}}}`)
      if (!newContent) return
      await logseq.Editor.updateBlock(blockUuid, newContent)
    },
  })

  // logseq.App.showMsg('hello, pomodoro timer :)')

//   logseq.Editor.registerSlashCommand(
//     '💥 Big Bang',
//     async () => {
//       const { content, uuid } = await logseq.Editor.getCurrentBlock()

//       logseq.App.showMsg(`
//         [:div.p-2
//           [:h1 "#${uuid}"]
//           [:h2.text-xl "${content}"]]
//       `)
//     },
//   )


//   // entries
//   logseq.Editor.registerSlashCommand('🍅 Pomodoro Timer', async () => {
//     await logseq.Editor.insertAtEditingCursor(
//       `{{renderer :pomodoro_${new Date()}}} `,
//     )
//   })

};

logseq.ready(main).catch(console.error);
