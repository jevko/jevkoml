import {jevkoFromString as parseJevkoWithHeredocs} from 'https://cdn.jsdelivr.net/gh/jevko/jevko.js@v0.1.5/mod.js'

export {fromXmlStr} from './fromXmlStr.js'

//?todo: ignore blanks before attribute names
const breakPrefix = prefix => {
  let i = prefix.length - 1
  for (; i >= 0; --i) {
    const c = prefix[i]
    if (c === '\r' || c === '\n' || c === '\\') {
      break
    }
  }
  // todo: should this if be removed?
  if (i >= 0) {
    const text = prefix.slice(0, i)
    const tag = prefix.slice(i + 1).trim()
    return [text, tag]
  }
  return ['', prefix.trim()]
}

// todo: process top-level/one-shot directives separately; prepTop(jevko) -> prep(...)
const prep = (jevko, dir = '.') => {
  const {subjevkos, ...rest} = jevko

  const subs = []
  for (const {prefix, jevko} of subjevkos) {
    const [text, tag] = breakPrefix(prefix)

    if (text !== '') subs.push({prefix: '', jevko: {subjevkos: [], suffix: text}})

    // remove disabled nodes (comments)
    if (tag.startsWith('-')) continue

    subs.push({prefix: tag, jevko: prep(jevko, dir)})
  }
  return {subjevkos: subs, ...rest}
}

const string = jevko => {
  const {subjevkos, suffix} = jevko

  if (subjevkos.length > 0) throw Error("oops")

  return suffix
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

//?todo: , options?
const toHtml = async (jevko) => {
  const {subjevkos, suffix} = jevko

  // text or highlighted text
  if (subjevkos.length === 0) {
    const {tag} = jevko
    if (tag === 'xml' || tag === 'html') {
      // xml/html literals -- no escaping
      return suffix
    } else if (tag !== undefined) {
      // unknown tag uses default highlighter
      const highlighter = highlighters.get(tag) ?? defaultHighlighter
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

  return ret + htmlEscape(suffix)
}

// todo: pass heredocs to pandoc/custom highlighters
const cdata = text => htmlEscape(text)
const defaultHighlighter = cdata

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
  const {subjevkos, suffix, ...rest} = jevko

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

  // note: pass in ...rest to handle highlighters and html/xml literals
  return `<${tagWithAttrs.join(' ')}>${await toHtml({subjevkos: children, suffix, ...rest})}</${tag}>`
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
  // todo?: rename to !cdata
  ['cdata', async jevko => {
    const ret = await toHtml(jevko)
    return `<![CDATA[${ret}]]>`
  }],
  // todo?: rename to !doctype
  ['doctype', async jevko => {
    const ret = await string(jevko)
    return `<!DOCTYPE ${ret}>`
  }],
])

const parseHtmlJevko = (source, dir = '.') => {
  return prep(parseJevkoWithHeredocs(source), dir)
}

// note: this is only used in tests
//?todo: move to test utils or sth
export const jevkoStrToHtmlStr = async (source, dir) => {
  return jevkoml(parseJevkoWithHeredocs(source), {dir})
}

export const jevkoml = async (preppedjevko, options) => {
  const {dir, root, prepend, extensions} = options
  const document = prep(preppedjevko, dir)

  if (extensions !== undefined) {
    const {elements} = extensions
    if (elements !== undefined) {
      const entries = Object.entries(elements)
      for (const [k, v] of entries) {
        ctx.set(k, v)
      }
    }
  }

  const {
    attrs,
    jevko,
  } = makeTop(document)

  if (root === undefined) {
    if (attrs.length > 0) throw Error('unexpected top-level attributes; remove or add /root')
  }

  let content = await toHtml(jevko)

  if (root !== undefined) {
    let main, rest
    if (Array.isArray(root)) {
      if (root.every(v => typeof v === 'string') === false) {
        throw Error(`Expected root to be a string or a list of strings!`)
      }
      ;[main, ...rest] = root
    } else {
      if (typeof root !== 'string') {
        throw Error(`Expected root to be a string or a list of strings!`)
      }
      main = root
      rest = []
    }

    let openers = ''
    let closers = ''
    for (const s of rest) {
      openers += `<${s}>`
      closers = `</${s}>` + closers 
    }

    content = `<${[main, ...attrs].join(' ')}>${openers}${content}${closers}</${main}>`
  }

  // note: this should be the last directive
  if (prepend !== undefined) {
    // todo: allow prepend be a single string
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

  return content
}
