import mustache from "mustache";
import * as path from "path";
import { promises as fs } from "fs";
const { writeFile, mkdir } = fs;

export interface ConfigData {
  [key: string]: boolean | string | number;
}

export interface Options {
  srcDir: string;
  moduleName: string;
}

const defaultOptions = {
  srcDir: "src",
  moduleName: "BuildConfig"
};

export async function createConfigFile(
  configuration: ConfigData,
  options: Options = defaultOptions
) {
  const fileOptions = { ...defaultOptions, ...options };
  const config = buildConfigList(configuration);
  const outFile = path.join(
    fileOptions.srcDir,
    fileOptions.moduleName.replaceAll(".", "/") + ".elm"
  );
  const outDir = path.dirname(outFile);
  const output = mustache.render(template, {
    config: config,
    file: fileOptions
  });

  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, output);
}

function buildConfigList(configuration: ConfigData) {
  return Object.entries(configuration)
    .map(([key, value]) => {
      let configType = typeof value;
      if (configType == "boolean") {
        return { key: key, elmType: "Bool", value: value ? "True" : "False " };
      } else if (configType == "string") {
        return { key: key, elmType: "String", value: `"${value}"` };
      } else if (configType == "number") {
        const elmType = Number.isInteger(value) ? "Int" : "Float";
        return { key: key, elmType: elmType, value: value };
      } else {
        throw new Error(
          `Unsupported Elm config type '${configType}' @ '${key}'`
        );
      }
    })
    .filter(item => {
      return item !== null;
    });
}

const template = `
module {{file.moduleName}} exposing (..)

{{#config}}
{{key}}: {{elmType}}
{{key}} = {{&value}}

{{/config}}
`.trim();
