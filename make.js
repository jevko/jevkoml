import {parseJevkoWithHeredocs} from 'https://cdn.jsdelivr.net/gh/jevko/parsejevko.js@v0.1.8/mod.js'
import {readTextFileSync} from './io.js'
import * as mod from "https://deno.land/std@0.163.0/streams/conversion.ts";

import { isAbsolute, join, dirname } from "https://deno.land/std@0.165.0/path/posix.ts";

const breakPrefix = prefix => {
  let i = prefix.length - 1
  for (; i >= 0; --i) {
    const c = prefix[i]
    if (c === '\r' || c === '\n' || c === '\\') {
      break
    }
  }
  // todo: perhaps trim-left the first part
  if (i > 0) return [prefix.slice(0, i), prefix.slice(i + 1).trim()]
  return ['', prefix.trim()]
}

// todo: process top-level/one-shot directives separately; prepTop(jevko) -> prep(...)
const prep = (jevko, dir = '.', top = false) => {
  const {subjevkos, ...rest} = jevko

  let output
  const subs = []
  for (const {prefix, jevko} of subjevkos) {
    const [text, tag] = breakPrefix(prefix)

    if (text !== '') subs.push({prefix: '', jevko: {subjevkos: [], suffix: text}})

    // remove disabled nodes (comments)
    if (tag.startsWith('-')) continue

    // process directives
    if (tag.startsWith('/')) {
      const directive = tag.slice(1).trim()
      if (directive === 'paste') {
        const fileName = string(jevko)

        let path
        if (isAbsolute(fileName)) path = fileName
        else path = join(dir, fileName)

        // console.log(isAbsolute(fileName), fileName, dir, path)

        const src = readTextFileSync(path)
        subs.push(makeTextNode(src))
      } else if (directive === 'import') {
        const fileName = string(jevko)

        let path
        if (isAbsolute(fileName)) path = fileName
        else path = join(dir, fileName)

        const src = readTextFileSync(path)
        const parsed = parseJevkoWithHeredocs(src)
        if (parsed.suffix.trim() !== '') throw Error('oops')
        // note: paths in imported file relative to IT rather than this file
        const prepped = prep(parsed, dirname(path))
        const {subjevkos} = prepped
        subs.push(...subjevkos)
      } else if (directive === 'output') {
        if (top === false) throw Error('oops')
        const fileName = string(jevko)
        output = fileName
      } else throw Error(`unknown directive: ${tag}`)
      continue
    }

    subs.push({prefix: tag, jevko: prep(jevko, dir)})
  }
  const ret = {subjevkos: subs, ...rest}

  if (top === true) return {output, document: ret}
  return ret
}

const string = jevko => {
  const {subjevkos, suffix, ...rest} = jevko

  if (subjevkos.length > 0) throw Error("oops")

  return suffix
}

const toHtml = async jevko => {
  const {subjevkos, suffix} = jevko

  if (subjevkos.length === 0) {
    const {tag} = jevko
    // console.log(jevko)
    if (tag !== undefined) {
      // unknown tag uses default highlighter
      const highlighter = highlighters.get(tag) ?? makeHighlighter(tag)
      return highlighter(suffix)
    }
    return suffix
  }

  // if (suffix.trim() !== '') throw Error('nonblank suffix')

  let ret = ''

  for (const {prefix, jevko} of subjevkos) {
    // todo: optimize makeTag -- perhaps simple 2-arg fn (uncurry)
    const maker = ctx.get(prefix) ?? makeTag(prefix)
    ret += await maker(jevko)
  }

  // todo: perhaps trim-right the suffix?
  return ret + suffix
}

const makeHighlighter = tag => async text => {

  const pandoc = Deno.run({
    cmd: ['pandoc', '-f', 'markdown'],
    stdin: "piped",
    stdout: 'piped',
  });

  const t = await pandoc.stdin.write(new TextEncoder().encode('```' + tag + '\n' + text + '\n```\n'))
  const x = await pandoc.stdin.close()
  // console.log('X', x)

  const out = await mod.readAll(pandoc.stdout)
  // console.log(out)
  await pandoc.stdout.close()
  const outt = new TextDecoder().decode(out)


  const status = await pandoc.status();

  // console.log(t,outt, status)



  return outt
}

// todo: pass heredocs to pandoc/custom highlighters
const textToPre = text => `<pre>${text}</pre>`
const highlighters = new Map([
  ['', textToPre],
  // ['ini', ],
  // ['json', text => text],
  // ['jevko', text => text],
  // ['yaml', text => text],
  // ['toml', text => text],
  // ['ini', text => text],
])

const makeTag = tag => async jevko => {
  const {subjevkos, suffix} = jevko

  const tagWithAttrs = [tag]
  const children = []
  const classes = []
  for (const s of subjevkos) {
    const {prefix, jevko} = s
    if (prefix === '.') classes.push(jevko.suffix)
    else if (prefix.endsWith('=')) tagWithAttrs.push(`${prefix}"${jevko.suffix}"`)
    else children.push(s)
  }

  if (classes.length > 0) tagWithAttrs.push(`class="${classes.join(' ')}"`)

  return `<${tagWithAttrs.join(' ')}>${await toHtml({subjevkos: children, suffix})}</${tag}>`
}

const makeSelfClosingTag = tag => jevko => {
  const {subjevkos, suffix} = jevko

  console.assert(suffix.trim() === "")

  const tagWithAttrs = [tag]
  const classes = []
  for (const s of subjevkos) {
    const {prefix, jevko} = s
    if (prefix === '.') classes.push(jevko.suffix)
    else if (prefix.endsWith('=')) tagWithAttrs.push(`${prefix}"${jevko.suffix}"`)
    else children.push(s)
  }

  if (classes.length > 0) tagWithAttrs.push(`class="${classes.join(' ')}"`)

  return `<${tagWithAttrs.join(' ')} />`
}


const span = makeTag('span')

const makeSpanWithClass = (...clzs) => async jevko => {
  const subs = [
    ...clzs.map(clz => ({prefix: ".", jevko: {subjevkos: [], suffix: clz}})),
    ...jevko.subjevkos
  ]
  return await span({subjevkos: subs, suffix: jevko.suffix})
}

// todo: extract
const suffixToJevko = suffix => {
  return {
    subjevkos: [],
    suffix,
  }
}

const makeTextNode = text => {
  return {
    prefix: "", 
    jevko: suffixToJevko(text),
  }
}

const makeTagWithAnchor = tag => {
  const t = makeTag(tag)
  return jevko => {
    const id = jevko.suffix.toLowerCase().replaceAll(' ', '-')

    const tree = parseHtmlJevko(
      `a [id=[${id}] href=[#${id}][#]]`
    )

    const headerContents = {
      subjevkos: [
        ...jevko.subjevkos,
        ...tree.subjevkos,
        makeTextNode(' ' + jevko.suffix),
      ],
      suffix: "",
    }

    return t(headerContents)
  }
}

// todo: support self-closing tags like br/[]
// todo: accept user-defined ctx
const ctx = new Map([
  ['', toHtml],
  ['#', makeTagWithAnchor('h1')],
  ['##', makeTagWithAnchor('h2')],
  ['br', makeSelfClosingTag('br')],
  ['sub', makeSpanWithClass('sub')],
  ['suf', makeSpanWithClass('suf')],
  ['suffix', makeSpanWithClass('suf', 'inline')],
  ['prefix', makeSpanWithClass('prefix')],
  ['jevko', makeSpanWithClass('jevko')],
  ['gray', makeSpanWithClass('gray')],
])

export const parseHtmlJevko = (source, dir = '.', top = false) => {
  return prep(parseJevkoWithHeredocs(source), dir, top)
}

export const jevkoStrToHtmlStr = async (source, dir) => {
  const {output, document} = parseHtmlJevko(source, dir, true)
  const content = await toHtml(document)

  return { 
    document: `<!doctype html>\n<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />\n${content}`, 
    output,
  }
}


