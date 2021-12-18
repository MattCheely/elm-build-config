module Main exposing (main)

import Html exposing (Html)
import Static.Config as Config


main : Html Never
main =
    { int = Config.int
    , float = Config.float
    , bool = Config.bool
    , string = Config.string
    }
        |> Debug.toString
        |> Html.text
