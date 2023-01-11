import {jevkoStrToHtmlStr} from '../../jevkoml.js'
import { assertEquals } from "../../devDeps.js"

Deno.test('markup', async () => {
  const document = await jevkoStrToHtmlStr(Deno.readTextFileSync('tests/markup/markup2.jevkoml'), 'tests/markup/')

  const expected = Deno.readTextFileSync('tests/markup/markup2.out.html')

  assertEquals(document, expected)
})