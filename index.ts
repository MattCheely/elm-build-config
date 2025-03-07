import mustache from "mustache";
import * as path from "path";
import { promises as fs } from "fs";
const { writeFile, mkdir } = fs;

export interface ConfigData {
  [key: string]: boolean | string | number;
}

/**
 * Options for the generated config file.
 */
export interface Options {
  srcDir: string;
  moduleName: string;
}

const defaultOptions = {
  srcDir: "src",
  moduleName: "BuildConfig",
};

/**
 * Creates an elm module that contains constants for the key-value pairs
 * specified in `configuration`.
 *
 * @param configuration - Key value pairs to be seralized to an elm module
 * @param options.srcDir - The path to and elm source dir, as defined in `elm.json` (Default: `src`)
 * @param options.moduleName - The desired name of the output module. The output file will be generated at the appropriate path based on the source dir and the chosen name (Default: `BuildConfig`)
 */
export async function createConfigFile(
  configuration: ConfigData,
  options: Options = defaultOptions,
) {
  const fileOptions = { ...defaultOptions, ...options };
  const config = buildConfigList(configuration);
  const outFile = path.join(
    fileOptions.srcDir,
    fileOptions.moduleName.replaceAll(".", "/") + ".elm",
  );
  const outDir = path.dirname(outFile);
  const output = mustache.render(template, {
    config: config,
    file: fileOptions,
  });

  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, output);
}

function buildConfigList(configuration: ConfigData) {
  return Object.entries(configuration)
    .map(([key, value]) => {
      if (typeof value == "boolean") {
        return { key: key, elmType: "Bool", value: value ? "True" : "False " };
      } else if (typeof value == "string") {
        if (needsTripleQuotes(value)) {
          return {
            key: key,
            elmType: "String",
            value: `"""${escapeSpecial(value)}"""`,
          };
        } else {
          return {
            key: key,
            elmType: "String",
            value: `"${escapeSpecial(value)}"`,
          };
        }
      } else if (typeof value == "number") {
        const elmType = Number.isInteger(value) ? "Int" : "Float";
        return { key: key, elmType: elmType, value: value };
      } else {
        throw new Error(
          `Unsupported Elm config type '${typeof value}' @ '${key}'`,
        );
      }
    })
    .filter((item) => {
      return item !== null;
    });
}

function needsTripleQuotes(str: string): boolean {
  return str.includes("\n");
}

/**
 * Escape double-quotes and unicode-escaped shaped things
 */
function escapeSpecial(str: string): string {
  return str.replaceAll('"', '\\"').replaceAll("\\u", "\\\\u");
}

const template = `
module {{file.moduleName}} exposing (..)

{{#config}}
{{key}}: {{elmType}}
{{key}} = {{&value}}

{{/config}}
`.trim();
