// Per-type metadata used across views (Dashboard tags, Controller layer icons,
// element naming). Keep in one place so colors and labels stay consistent.

export const ELEMENT_TYPES = ['text', 'image', 'video', 'audio']

export const TYPE_LABELS = {
  text: 'Text',
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
}

// Compact tag styling for the dashboard scene cards.
export const TYPE_TAG_CLASSES = {
  text: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
  image: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
  video: 'bg-pink-500/15 text-pink-300 border-pink-500/40',
  audio: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
}

// Square icon badge backgrounds in the controller's layer list.
export const TYPE_ICON_BG = {
  text: 'bg-indigo-500/15 border-indigo-500/40',
  image: 'bg-purple-500/15 border-purple-500/40',
  video: 'bg-pink-500/15 border-pink-500/40',
  audio: 'bg-amber-500/15 border-amber-500/40',
}

export const TYPE_ICON_FG = {
  text: 'text-indigo-300',
  image: 'text-purple-300',
  video: 'text-pink-300',
  audio: 'text-amber-300',
}

export const DEFAULT_TEXT_CONTENT = 'NEW TEXT'
export const DEFAULT_IMAGE_CONTENT = 'https://placehold.co/600x400/png'

export function defaultContentFor(type) {
  if (type === 'text') return DEFAULT_TEXT_CONTENT
  if (type === 'image') return DEFAULT_IMAGE_CONTENT
  return ''
}
