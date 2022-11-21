import {jevkoStrToHtmlStr} from '../../make.js'
import { assertEquals } from "https://deno.land/std@0.165.0/testing/asserts.ts";

Deno.test('rss', async () => {
  const {document, output} = await jevkoStrToHtmlStr(Deno.readTextFileSync('tests/rss/feed.jevkoml'), 'tests/rss/')

  const expected = Deno.readTextFileSync('tests/rss/feed.expected.rss')

  assertEquals(document, expected)
})