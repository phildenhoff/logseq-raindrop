# Svelte / Vite Logseq plugin

A **VERY** rudimentary plugin using Svelte and Vite. I plan on working on this more, but i wanted to get an early demo up in case people ran into the same Logseq plugin bugs I did.

If you try to run it, you need to get a raindrop API acces token -- make an app and go through the whole OAuth flow with a user account to get the tocken!

## Building your own Logseq plugin

- You need to have a `main` field in your package.json. I don't know if it needs to be on the `Logseq` field or not, but it should be there.
- Your plugin name cannot have slashes.
- When you build your app, make sure the base path is './' so that your index.html is referencing local files (vs. files at the root of your OS)
- You can totally use `yarn dev` and get HMR.
  - This didn't work in anothe project I was tinkering with, but it was literally no extra effort for me to get this set up
- You can use Yarn 2. No idea why I thought it wouldn't work, but it does.
  - That said, I'm not sure I see the value on Yarn 2...
