import {jevkoStrToHtmlStr} from '../../jevkoml.js'
import { assertEquals } from "../../devDeps.js"

Deno.test('xml literals', async () => {
  const document = await jevkoStrToHtmlStr(Deno.readTextFileSync('tests/xml-literals/test.jevkoml'), 'tests/xml-literals/')

  const expected = Deno.readTextFileSync('tests/xml-literals/feed.expected.rss')

  assertEquals(document, expected)
})