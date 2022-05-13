# Raindrop plugin for Logseq

A simple plugin that allows you to save URLs to Raindrop.

https://user-images.githubusercontent.com/17505728/168242341-3cad1a5f-bff9-4019-ac5f-b48a322c901a.mov

To get set up, generate a Raindrop API access token from the [Settings >
Integrations](https://app.raindrop.io/settings/integrations) page. Use the Test
Token as your API access token -- or walk through the entire OAuth flow, if
that's your preference.

## Planned work

- Import annotations from Raindrop

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
