#!/usr/bin/env node

import * as buildConfig from "../index.js";
const { createConfigFile } = buildConfig;
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const elmDir = path.join(testDir, "testProject");
const elmSrc = path.join(elmDir, "src");

await testGoodConfig();
await testBadConfig();

async function testGoodConfig() {
  await createConfigFile(
    {
      bool: true,
      string: "hello",
      stringWithLineBreak: 'line 1\nline 2',
      stringWithQuotes: '"This is quoted"',
      stringWithQuotesAndLineBreak: '"Line 1\nLine 2"',
      stringWithUnicodePatterns: "\\u{20A1}\\u{20A2}\\u{X}\\u{}",
      int: 1,
      float: 3.14159
    },
    { srcDir: elmSrc, moduleName: "Static.Config" }
  );

  const result = spawnSync(
    "elm-test",
    [],
    {
      cwd: elmDir,
      stdio: "inherit"
    }
  );

  if (result.status != 0) {
    throw new Error("Elm tests failed");
  }
}

async function testBadConfig() {
  let didFail = false;
  try {
    await createConfigFile(
      {
        bool: true,
        string: "hello",
        int: 1,
        float: 3.14159,
        invalid: { foo: "bar" }
      },
      { srcDir: elmSrc, moduleName: "Static.Config" }
    );
  } catch (e) {
    didFail = true;
  }

  if (!didFail) {
    throw new Error("Bad config values accepted");
  }
}
