import {resolveEntity} from '../../fromXmlStr.js'
import { assertEquals } from "https://deno.land/std@0.171.0/testing/asserts.ts";

Deno.test('entity hex', () => {
  const cases = [
    ['&#x00;', 0x00],
    ['&#x01;', 0x01],
    ['&#x01010;', 0x01010],
  ]
  for (const [a, b] of cases) {
    const actual = resolveEntity(a)
    const expected = String.fromCodePoint(b)

    assertEquals(actual, expected)
  }
})
Deno.test('entity dec', () => {
  const cases = [
    ['&#00;', 0],
    ['&#1;', 1],
    ['&#5333;', 5333],
  ]
  for (const [a, b] of cases) {
    const actual = resolveEntity(a)
    const expected = String.fromCodePoint(b)

    assertEquals(actual, expected)
  }
})