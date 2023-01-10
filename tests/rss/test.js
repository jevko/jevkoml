import {jevkoStrToHtmlStr} from '../../jevkoml.js'
import { assertEquals } from "https://deno.land/std@0.171.0/testing/asserts.ts";

Deno.test('rss', async () => {
  const document = await jevkoStrToHtmlStr(Deno.readTextFileSync('tests/rss/feed.jevkoml'), 'tests/rss/')

  const expected = Deno.readTextFileSync('tests/rss/feed.expected.rss')

  assertEquals(document, expected)
})