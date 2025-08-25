Download the official Power BI Report Theme JSON Schema and save it as `reportThemeSchema.json` in this folder.

Schema source:
https://github.com/microsoft/powerbi-desktop-samples/tree/main/Report%20Theme%20JSON%20Schema

After adding the schema file, run:

npm install ajv
node scripts/validateSchema.js out/theme.schema.json
