// todo: deps.js, mod.js, etc.
import {fnlxml, resolveEntity2} from 'https://raw.githubusercontent.com/xtao-org/fnlxml/v0.1.0/fnlxml.js'
import {escape} from 'https://cdn.jsdelivr.net/gh/jevko/jevko.js@v0.1.5/mod.js'

export const fromXmlStr = (str) => {
  let ret = ''
  let hasAttrs = false
  const stream = fnlxml({
    emit(name, str_) {
      const str = escape(str_)
      if (name === 'STagName') ret += `\\${str} [`
      else if (name === 'AttValue') ret += str
      else if (name === 'Reference') ret += resolveEntity2(str)
      else if (name === 'Attribute') ret += `]`
      else if (name === 'ETagName') ret += `]`
      else if (name === 'CData') ret += str
      else if (name === 'CharData') ret += str

      else if (name === 'AttName') ret += `${str}=[`

      // else if (name === 'AttName') {
      //   if (hasAttrs === false) {
      //     hasAttrs = true
      //     ret += '['
      //   }
      //   ret += `${str} [`
      // }
      // else if (name === 'STagC' || name === 'EETagC') {
      //   if (hasAttrs) {
      //     ret += ']'
      //     hasAttrs = false
      //   }
      // }
      // else throw Error('oops' + name)
    }
  })
  stream.chunk(str)
  stream.end()
  return ret
}