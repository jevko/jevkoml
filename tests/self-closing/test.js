import {jevkoStrToHtmlStr} from '../../jevkoml.js'
import { assertEquals, assertRejects } from "../../devDeps.js"

Deno.test('self-closing tags', async () => {
  const document = await jevkoStrToHtmlStr(`hr/[.[blue]title=[line]]`, '.')

  const expected = `<hr class="blue" title="line" />`

  assertEquals(document, expected)

  assertRejects(async () => {
    await jevkoStrToHtmlStr(`hr/[.[blue]title=[line]br/[]]`, '.')
  })
})