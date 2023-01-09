import {jevkoStrToHtmlStr} from '../../jevkoml.js'
import { assertEquals } from "https://deno.land/std@0.171.0/testing/asserts.ts";

Deno.test('self-closing tags', async () => {
  const document = await jevkoStrToHtmlStr(`hr/[.[blue]title=[line]]`, '.')

  const expected = `<hr class="blue" title="line" />`

  assertEquals(document, expected)
})