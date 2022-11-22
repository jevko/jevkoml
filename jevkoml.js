import {prep} from './make.js'
// import {readTextFileSync, readStdinText, writeTextFileSync} from './io.js'

// import { dirname, join } from "https://deno.land/std@0.165.0/path/mod.ts";

// // todo: exactly 1?
// let src
// let dir
// if (Deno.args.length > 0) {
//   const fileName = Deno.args[0]
//   src = readTextFileSync(fileName)
//   dir = dirname(fileName)
// } else {
//   src = await readStdinText()
//   dir = '.'
// }

// const source = src

// const {document, output} = await jevkoStrToHtmlStr(source, dir)

// if (output === undefined) console.log(document)
// else writeTextFileSync(join(dir, output), document)

export const jevkoml = async (jevko, dir) => {
  const {output, prepend, root, document} = prep(jevko, dir, true)

  const {
    attrs,
    jevko,
  } = makeTop(document)

  if (root === undefined) {
    if (attrs.length > 0) throw Error('unexpected top-level attributes; remove or add /root')
  }

  let content = await toHtml(jevko)

  if (prepend !== undefined) {
    const keywords = prepend
    // note: hacky
    if (keywords.includes('viewport')) {
      content = `<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />` + content
    }
    if (keywords.includes('doctype')) {
      content = `<!doctype html>\n` + content
    }
    // todo: ?xml special element
    // note: this should be last (so it's always prepended at the beginning)
    if (keywords.includes('xml1')) {
      content = `<?xml version="1.0" encoding="UTF-8"?>\n` + content
    }
  }

  if (root !== undefined) {
    const [main, ...rest] = root

    let openers = ''
    let closers = ''
    for (const s of rest) {
      openers += `<${s}>`
      closers = `</${s}>` + closers 
    }

    content = `<${[main, ...attrs].join(' ')}>${openers}${content}${closers}</${main}>`
  }

  return content
}

