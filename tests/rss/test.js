import {jevkoStrToHtmlStr} from '../../jevkoml.js'
import { assertEquals } from "../../devDeps.js"

Deno.test('rss', async () => {
  const document = await jevkoStrToHtmlStr(Deno.readTextFileSync('tests/rss/feed.jevkoml'), 'tests/rss/')

  const expected = Deno.readTextFileSync('tests/rss/feed.expected.rss')

  assertEquals(document, expected)
})