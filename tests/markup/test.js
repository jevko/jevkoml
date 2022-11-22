import {jevkoStrToHtmlStr} from '../../jevkoml.js'
import { assertEquals } from "https://deno.land/std@0.165.0/testing/asserts.ts";

Deno.test('markup', async () => {
  const {document, output} = await jevkoStrToHtmlStr(Deno.readTextFileSync('tests/markup/markup2.jevkoml'), 'tests/markup/')

  const expected = Deno.readTextFileSync('tests/markup/markup2.out.html')

  assertEquals(document, expected)
})