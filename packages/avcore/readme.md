!["FAILS logo"](failslogo.svg)
# Fancy automated internet lecture system (**FAILS**) - components

This package is part of FAILS.
A web-based system lecture systems developed from the exprience  of real university lectures.

FAILS is licensed via GNU Affero GPL version 3.0 

## Package avcore

This package is part of the audio, video stack of **FAILS**,
which may be useful outside of FAILS.

It provides the core worker of **FAILS** audio, video processing,
sitting on top of avcomponents. It also provides several polyfills for webcodecs,
and uses Webtransport or a uses Webtransport over Websocket wrapper as fallback.

## Installation
For installation instructions for a containerized envoironment, please see the readme and documentation in the main monorepo [fails-components/fancy-lectures](https://github.com/fails-components/fancy-lecture "fails-components/fancy-lecture").