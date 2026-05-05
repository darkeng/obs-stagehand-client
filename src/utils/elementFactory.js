import { TYPE_LABELS, defaultContentFor } from '../constants/elements'
import { sizeForAspect } from './elementSize'

const generateId = () => Math.random().toString(36).substring(2, 11)

const shortId = (id) => (id ? id.slice(0, 4) : '')

export function elementDisplayName(el) {
  return `${TYPE_LABELS[el.type] || 'Element'} ${shortId(el.id)}`
}

function defaultSizeFor(type) {
  if (type === 'audio') return { width_pc: 10, height_pc: 10 }
  return sizeForAspect('16:9')
}

function nextNameForType(elements, type) {
  const label = TYPE_LABELS[type] || 'Element'
  const taken = elements
    .filter(e => e.type === type)
    .map(e => e.name)
    .filter(n => n && n.startsWith(`${label} `))
  let n = taken.length + 1
  const used = new Set(taken)
  while (used.has(`${label} ${n}`)) n++
  return `${label} ${n}`
}

function nextZIndex(elements) {
  const max = elements.reduce((m, e) => Math.max(m, e.zIndex || 0), 0)
  return max + 1
}

export function buildNewElement(type, existingElements) {
  const size = defaultSizeFor(type)
  return {
    id: generateId(),
    type,
    name: nextNameForType(existingElements, type),
    content: defaultContentFor(type),
    x_pc: 30,
    y_pc: 30,
    width_pc: size.width_pc,
    height_pc: size.height_pc,
    zIndex: nextZIndex(existingElements),
    visible: false,
    fontFamily: 'Inter',
    fontColor: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 2,
    playing: false,
    loop: true,
    volume: 1,
    mask_enabled: false,
    mask_shape: 'inset',
    mask_top_pc: 0,
    mask_right_pc: 0,
    mask_bottom_pc: 0,
    mask_left_pc: 0,
    mask_round_pc: 0,
  }
}

// "Modified" = the user has touched anything that took meaningful input —
// content or a custom name. Toggling visible/playing or moving the element
// doesn't count, since those are quick to redo and don't represent lost typing.
export function isElementModified(el) {
  if (!el) return false
  const defaultName = elementDisplayName(el)
  if (el.content && el.content !== defaultContentFor(el.type)) return true
  if (el.name && el.name !== defaultName) return true
  return false
}

// Reorders by id list (top-of-array → highest zIndex). Returns the elements
// whose zIndex actually changed, ready to be sent through `updateElementsBatch`.
export function reorderByIds(elements, orderedIds) {
  const total = orderedIds.length
  const updates = []
  orderedIds.forEach((id, idx) => {
    const el = elements.find(e => e.id === id)
    if (!el) return
    const newZ = total - idx
    if (el.zIndex !== newZ) updates.push({ ...el, zIndex: newZ })
  })
  return updates
}
