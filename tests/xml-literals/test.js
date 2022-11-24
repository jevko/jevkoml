import {jevkoStrToHtmlStr} from '../../jevkoml.js'
import { assertEquals } from "https://deno.land/std@0.165.0/testing/asserts.ts";

Deno.test('xml literals', async () => {
  const document = await jevkoStrToHtmlStr(Deno.readTextFileSync('tests/xml-literals/test.jevkoml'), 'tests/xml-literals/')

  const expected = Deno.readTextFileSync('tests/xml-literals/feed.expected.rss')

  assertEquals(document, expected)
  // console.log(document)
})