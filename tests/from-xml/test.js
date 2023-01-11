import {fromXmlStr} from '../../fromXmlStr.js'
import {jevkoStrToHtmlStr} from '../../jevkoml.js'
import { assertEquals } from "https://deno.land/std@0.171.0/testing/asserts.ts";
import * as path from "https://deno.land/std@0.57.0/path/mod.ts";

const __dirname = path.dirname(path.fromFileUrl(import.meta.url))

Deno.test('from xml', async () => {
  const source = Deno.readTextFileSync(__dirname + '/sample.xml')
  const jevkoStr = fromXmlStr(source)
  const htmlStr = await jevkoStrToHtmlStr(jevkoStr)
  // console.log(jevkoStr)
  // console.log(htmlStr)
  assertEquals(source, htmlStr)
})
