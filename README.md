# Vector Fields Plugin

Vector Fields is a generative tool that helps you play, tinker, and hack together patterns made from shapes.

Make visually stunning graphics by playing with different vector field presets.

Use dots, lines, arrows, triangles or even custom SVGS to create... stuff.

### Some tips:

When you select a frame, the plugin will automatically adjust the SVG you're building to fit. If it has a background color, it will also use it!
Selecting any vector on your page will use it in the pattern which makes it easy to create new ideas.
Upload a custom SVG by selecting "custom shape" under the shape dropdown and paste your svg in.
Use the reset button to undo any changes you've made.
Play with the column and row counts, anything over 100 will make your computer chug so just be patient when rendering!


## To use this plugin

- Run `yarn` to install dependencies.
- Run `yarn build:watch` to start webpack in watch mode.
- Open `Figma` -> `Plugins` -> `Development` -> `Import plugin from manifest...` and choose `manifest.json` file from this repo.
- There are images in the `/imgs` directory if you need to publish internally.

⭐ To change the UI of your plugin (the react code), start editing [App.tsx](./src/app/components/App.tsx).  
⭐ To interact with the Figma API edit [controller.ts](./src/plugin/controller.ts).  
⭐ Read more on the [Figma API Overview](https://www.figma.com/plugin-docs/api/api-overview/).

## Toolings

This repo is using:

- React + Webpack
- TypeScript
- Prettier precommit hook
