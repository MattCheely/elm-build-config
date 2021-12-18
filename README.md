# The Basics

elm-build-config provides a simple utility for generating elm files that contain
static configuration key-value pairs defined at build time. e.g.:

```elm
module BuildConfig exposing (..)

deployPath : String
deployPath = "/my/deploy/path/"

isProduction : Bool
isProduction = True
```

To generate a config file, use the `createConfigFile` function:

```typescript
import { createConfigFile } from "elm-build-config";

// Normally this would use dynamic values injected by your build tooling.
const config = {
  bool: true,
  string: "hello",
  int: 1,
  float: 3.14159
};

createConfigFile(config);
```

The configuration object passed to `createConfigFile` can contain booleans,
strings and numbers (which will be converted to int or float depending on value).
Any invalid values will cause the file generation to fail.

By default the output file will be located at `src/BuildConfig.elm`, but you can
customize the output with options:

```typescript
createConfigFile(config, { srcDir: "elmApp/src", moduleName: "Config.Build" });
```

The available options are:

`srcDir`: The path to and elm src dir, as defined in `elm.json`. (Default: `src`)

`moduleName`: The desired name of the output module. The output file will be
generated at the appropriate path based on the source dir and the chosen name.
(Default: `BuildConfig`)

# Example Usage

elm-build-config isn't that useful on it's own. It's intended to be part of a
build process. Here we'll outline an example of using it in an [elm-spa](https://www.elm-spa.dev/) app built by [Vite](https://vitejs.dev/).
In this app, the eventual deploy path is set by an external process that provides
a `DEPLOY_PATH` environment variable.

First, we update our `vite.config.js` file to run `createConfigFile` when the
build starts, by defining a small plugin in the config file:

```typescript
import { defineConfig } from "vite";
import elmPlugin from "vite-plugin-elm";
import { createConfigFile } from "elm-build-config";

export default defineConfig(({ command, mode }) => {
  //Pull vite's basePath from the environment if present
  const basePath = process.env.DEPLOY_PATH || "./";

  return {
    root: "public",
    base: basePath,
    plugins: [
      elmPlugin(),
      // We pass the path to a locally defined plugin
      configPlugin({ deployPath: basePath })
    ],
    build: {
      outDir: "../dist",
      emptyOutDir: true
    }
  };
});

// This is a minimal vite plugin that calls `createConfigFile` with our config
function configPlugin(configData, options) {
  return {
    name: "elm-build-config",
    buildStart() {
      createConfigFile(configData, options);
    }
  };
}
```

This creates a `BuildConfig.elm` file in our project:

```elm
module BuildConfig exposing (..)

deployPath: String
deployPath = "/deploy/path/"
```

From this, we create a `Path.elm` file with a few useful utility functions:

```elm
module Path exposing (inApp, normalizeUrl)

import BuildConfig exposing (deployPath)
import Url exposing (Url)


{-| Convert a path relative to the root of the app to a path based on our
deploy location. This is useful for generating links and navigation commands.
-}
inApp : String -> String
inApp path =
    deployPath ++ path


{-| Given a Url with a full path, trim the deployPath from the front of it. If
we do this before handing the Url to elm-spa for routing, everything should work
nicely.
-}
normalizeUrl : Url -> Url
normalizeUrl url =
    let
        newPath =
            if String.startsWith deployPath url.path then
                String.dropLeft (String.length deployPath) url.path

            else
                url.path
    in
    { url | path = newPath }
```

The we update `Main.elm` (ejecting from `.elm-spa/defaults` if needed):

```elm
init : Shared.Flags -> Url -> Key -> ( Model, Cmd Msg )
init flags rawUrl key =
    let
        -- Normalize the url before init
        url =
            Path.normalizeUrl rawUrl

        ( shared, sharedCmd ) =
            Shared.init (Request.create () url key) flags

        ( page, effect ) =
            Pages.init (Route.fromUrl url) shared url key
    in
    ( Model url key shared page
    , Cmd.batch
        [ Cmd.map Shared sharedCmd
        , Effect.toCmd ( Shared, Page ) effect
        ]
    )
```

```elm
update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ChangedUrl rawUrl ->
            let
                -- Normalize incoming Urls
                url =
                    Path.normalizeUrl rawUrl
            in
            if url.path /= model.url.path then
                let
                    ( page, effect ) =
                        Pages.init (Route.fromUrl url) model.shared url model.key
                in
                ( { model | url = url, page = page }
                , Effect.toCmd ( Shared, Page ) effect
                )

            else
                ( { model | url = url }, Cmd.none )

```

And that's it! (probably, I just built this thing)
