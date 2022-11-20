import {jevkoStrToHtmlStr} from '../make.js'
import { assertEquals } from "https://deno.land/std@0.165.0/testing/asserts.ts";

Deno.test('markup2', async () => {
  const {document, output} = await jevkoStrToHtmlStr(Deno.readTextFileSync('test/markup2.jevkoml'), 'test/')

  const expected = Deno.readTextFileSync('test/markup2.out.html')

  assertEquals(document, expected)
})