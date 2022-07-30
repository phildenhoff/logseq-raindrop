# Raindrop plugin for Logseq

A plugin that allows you to import annotations & bookmarks from Raindrop, and save URLs back to Raindrop.

https://user-images.githubusercontent.com/17505728/181995626-3574af69-e43f-4a4e-b9f8-e5e29ce468ec.mp4

## Setting up your plugin

To get set up, generate a Raindrop API access token from the [Settings >
Integrations](https://app.raindrop.io/settings/integrations) page. Use the Test
Token as your API access token -- or walk through the entire OAuth flow, if
that's your preference.

https://user-images.githubusercontent.com/17505728/169188456-f346ed11-dbc3-45b2-8bac-336d7151a79a.mp4

Don't try to use the tokens in the video. They've already been expired and the app deleted.

## Demos

### Saving URLs to Raindrop

https://user-images.githubusercontent.com/17505728/168242341-3cad1a5f-bff9-4019-ac5f-b48a322c901a.mov

## Planned work

- See the [open Issues](https://github.com/phildenhoff/logseq-raindrop/issues)

## Building your own Logseq plugin

I ran into some issues getting this plugin set up from scratch. Here's some
advive if you want to write your own Logseq plugin.

- You need to have a `main` field in your package.json. I don't know if it
  needs to be on the `Logseq` field or not, but it should be there.
- Your plugin name cannot have slashes.
- When you build your app, make sure the base path is './' so that your
  index.html is referencing local files (vs. files at the root of your OS)
- You can totally use `yarn dev` and get HMR.
  - I didn't think this would work for some reason, but it was approximately
    zero work to get set up, and works pretty well.
- You can use Yarn 2. No idea why I thought it wouldn't work, but it does.
  - That said, I'm not sure I see the value of Yarn 2. No Dependabot is a huge
    downside.
