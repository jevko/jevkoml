import {parseJevkoWithHeredocs} from 'https://cdn.jsdelivr.net/gh/jevko/parsejevko.js@v0.1.8/mod.js'
import {readTextFileSync} from './io.js'
import * as mod from "https://deno.land/std@0.163.0/streams/conversion.ts";

import { isAbsolute, join, dirname } from "https://deno.land/std@0.165.0/path/mod.ts";

const breakPrefix = prefix => {
  let i = prefix.length - 1
  for (; i >= 0; --i) {
    const c = prefix[i]
    if (c === '\r' || c === '\n' || c === '\\') {
      break
    }
  }
  if (i > 0) return [prefix.slice(0, i), prefix.slice(i + 1).trim()]
  return ['', prefix.trim()]
}

// todo: process top-level/one-shot directives separately; prepTop(jevko) -> prep(...)
const prep = (jevko, dir = '.', top = false) => {
  const {subjevkos, ...rest} = jevko

  let output, prepend, root
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
      } else if (directive === 'prepend') {
        if (top === false) throw Error('oops')
        prepend = listOfString(jevko)
      } else if (directive === 'root') {
        if (top === false) throw Error('oops')
        root = listOfString(jevko)
      } else throw Error(`unknown directive: ${tag}`)
      continue
    }

    subs.push({prefix: tag, jevko: prep(jevko, dir)})
  }
  const ret = {subjevkos: subs, ...rest}

  if (top === true) return {output, prepend, root, document: ret}
  return ret
}

const string = jevko => {
  const {subjevkos, suffix} = jevko

  if (subjevkos.length > 0) throw Error("oops")

  return suffix
}

const listOfString = jevko => {
  const {subjevkos, suffix} = jevko

  if (subjevkos.length === 0) return [suffix]

  const ret = []
  for (const {prefix, jevko} of subjevkos) {
    if (prefix !== '') throw Error('oops')
    ret.push(string(jevko))
  }
  return ret
}

// todo?: perhaps separate htmlEscape for attributes that does &quot; -- otherwise don't
const htmlEscape = str => {
  let ret = ''

  let h = 0
  for (let i = 0; i < str.length; ++i) {
    const c = str[i]
    if (c === '<') {
      ret += str.slice(h, i) + '&lt;'
      h = i + 1
    }
    else if (c === '&') {
      ret += str.slice(h, i) + '&amp;'
      h = i + 1
    } else if (c === '"') {
      ret += str.slice(h, i) + '&quot;'
      h = i + 1
    }
  }
  return ret + str.slice(h)
}

const toHtml = async jevko => {
  const {subjevkos, suffix} = jevko

  // text or highlighted text
  if (subjevkos.length === 0) {
    const {tag} = jevko
    // console.log(jevko)
    if (tag !== undefined) {
      // unknown tag uses default highlighter
      const highlighter = highlighters.get(tag) ?? makeHighlighter(tag)
      // note: assuming highlighter will do htmlEscape
      return highlighter(suffix)
    }
    return htmlEscape(suffix)
  }

  // if (suffix.trim() !== '') throw Error('nonblank suffix')

  // tags
  let ret = ''
  for (const {prefix, jevko} of subjevkos) {
    // todo: optimize makeTag -- perhaps simple 2-arg fn (uncurry)
    const maker = ctx.get(prefix) ?? makeTag(prefix)
    ret += await maker(jevko)
  }

  // todo: perhaps don't trim-right the suffix?
  return ret + htmlEscape(suffix.trimEnd())
}

const makeHighlighter = tag => async text => {

  // todo: use pandoc only if available, otherwise a js lib (if available) or nothing = textToPre
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
const cdata = text => htmlEscape(text)

const highlighters = new Map([
  ['', cdata],
  // ['ini', ],
  // ['json', text => text],
  // ['jevko', text => text],
  // ['yaml', text => text],
  // ['toml', text => text],
  // ['ini', text => text],
])

// todo: refactor
const makeTop = jevko => {
  const {subjevkos, suffix} = jevko

  const attrs = []
  const children = []
  const classes = []
  for (const s of subjevkos) {
    const {prefix, jevko} = s
    if (prefix === '.') classes.push(jevko.suffix)
    else if (prefix.endsWith('=')) attrs.push(`${prefix}"${htmlEscape(jevko.suffix)}"`)
    else children.push(s)
  }

  // todo?: htmlEscape classnames
  if (classes.length > 0) attrs.push(`class="${classes.join(' ')}"`)

  return {
    attrs,
    jevko: {subjevkos: children, suffix},
  }
}

const makeTag = tag => async jevko => {
  const {subjevkos, suffix} = jevko

  const tagWithAttrs = [tag]
  const children = []
  const classes = []
  for (const s of subjevkos) {
    const {prefix, jevko} = s
    if (prefix === '.') classes.push(jevko.suffix)
    else if (prefix.endsWith('=')) tagWithAttrs.push(`${prefix}"${htmlEscape(jevko.suffix)}"`)
    else children.push(s)
  }

  // todo?: htmlEscape classnames
  if (classes.length > 0) tagWithAttrs.push(`class="${classes.join(' ')}"`)

  return `<${tagWithAttrs.join(' ')}>${await toHtml({subjevkos: children, suffix})}</${tag}>`
}

const makeSelfClosingTag = tag => jevko => {
  const {subjevkos, suffix} = jevko

  console.assert(suffix.trim() === "")

  const tagWithAttrs = [tag]
  const classes = []

  // todo: extract common between makeTag and makeSelfClosingTag
  for (const s of subjevkos) {
    const {prefix, jevko} = s
    if (prefix === '.') classes.push(jevko.suffix)
    else if (prefix.endsWith('=')) tagWithAttrs.push(`${prefix}"${htmlEscape(jevko.suffix)}"`)
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
    // todo: better normalization -- only a-z and minus allowed, keep a global list of ids and append a number if exists
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
  ['cdata', async jevko => {
    const ret = await toHtml(jevko)
    return `<![CDATA[ ${ret} ]]>`
  }],
  ['DOCTYPE', async jevko => {
    const ret = await string(jevko)
    return `<!DOCTYPE ${ret}>`
  }],
])

export const parseHtmlJevko = (source, dir = '.', top = false) => {
  return prep(parseJevkoWithHeredocs(source), dir, top)
}

export const jevkoStrToHtmlStr = async (source, dir) => {
  const {output, prepend, root, document} = parseHtmlJevko(source, dir, true)

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

  return { 
    document: content, 
    output,
  }
}


