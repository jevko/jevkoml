import {jevkoStrToHtmlStr} from './make.js'
import {readTextFileSync, readStdinText, writeTextFileSync} from './io.js'

import { dirname, join } from "https://deno.land/std@0.165.0/path/posix.ts";

// todo: exactly 1?
let src
let dir
if (Deno.args.length > 0) {
  const fileName = Deno.args[0]
  src = readTextFileSync(fileName)
  dir = dirname(fileName)
} else {
  src = await readStdinText()
  dir = '.'
}

const source = src

const {document, output} = await jevkoStrToHtmlStr(source, dir)

if (output === undefined) console.log(document)
else writeTextFileSync(join(dir, output), document)