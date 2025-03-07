module ValueChecks exposing (..)

import Expect exposing (Expectation)
import Fuzz exposing (Fuzzer, int, list, string)
import Static.Config as Config
import Test exposing (..)


suite : Test
suite =
    describe "The generate config file has correct values"
        [ test "bool" <|
            \_ ->
                Expect.equal Config.bool True
        , test "string" <|
            \_ ->
                Expect.equal Config.string "hello"
        , test "string with line break" <|
            \_ ->
                Expect.equal Config.stringWithLineBreak "line 1\nline 2"
        , test "string with quotes and line break" <|
            \_ ->
                Expect.equal
                    Config.stringWithQuotesAndLineBreak
                    "\"Line 1\nLine 2\""
        , test "string with unicode patterns" <|
            \_ ->
                Expect.equal
                    Config.stringWithUnicodePatterns
                    "\\u{20A1}\\u{X}\\u{}\\u1234"
        , test "int" <|
            \_ ->
                Expect.equal Config.int 1
        , test "float" <|
            \_ ->
                Expect.within (Expect.Absolute 0.000001)
                    Config.float
                    3.14159
        ]
