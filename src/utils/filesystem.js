// A small tree filesystem for the desktop, persisted in localStorage.
// Each node: { id, type: 'file' | 'folder', name, parentId, content, position }
//   - parentId === null  -> lives on the desktop
//   - parentId === <id>  -> lives inside that folder
//   - position is relative to its container (desktop or folder window)
const STORAGE_KEY = 'xp-filesystem'
const LEGACY_DOCS_KEY = 'xp-desktop-documents'

const readRaw = (key) => {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

const persist = (nodes) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes))
  } catch {
    /* localStorage unavailable or full — keep the in-memory copy */
  }
  return nodes
}

// Convert any pre-existing flat text documents into filesystem nodes (one time).
const migrateLegacyDocuments = () => {
  const legacy = readRaw(LEGACY_DOCS_KEY)
  if (!legacy) return []
  const migrated = legacy.map((d) => ({
    id: d.id,
    type: 'file',
    name: d.name,
    parentId: null,
    content: d.content ?? '',
    position: d.position || { x: 130, y: 20 }
  }))
  persist(migrated)
  return migrated
}

export const loadNodes = () => {
  const existing = readRaw(STORAGE_KEY)
  if (existing) return existing
  return migrateLegacyDocuments()
}

export const getNode = (id) => loadNodes().find((n) => n.id === id) || null

// Visible children of a container — trashed items live in the Recycle Bin, not
// in their original folder.
export const childrenOf = (parentId) =>
  loadNodes().filter((n) => n.parentId === parentId && !n.trashed)

const makeId = () => `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

// Pick a unique "base", "base (2)", … name among the given siblings.
const makeUniqueName = (siblings, base, ext = '') => {
  const taken = new Set(siblings.map((n) => n.name))
  let name = `${base}${ext}`
  let n = 2
  while (taken.has(name)) {
    name = `${base} (${n})${ext}`
    n += 1
  }
  return name
}

// Cascade new items so they don't stack exactly on top of each other.
const cascadePosition = (count) => ({
  x: 24 + (count % 6) * 28,
  y: 20 + (count % 6) * 28
})

const createNode = (parentId, type, base, ext, content, position) => {
  const nodes = loadNodes()
  const siblings = nodes.filter((n) => n.parentId === parentId && !n.trashed)
  const node = {
    id: makeId(),
    type,
    name: makeUniqueName(siblings, base, ext),
    parentId,
    content,
    // Drop the new item where the user right-clicked, falling back to a cascade.
    position: position || cascadePosition(siblings.length)
  }
  return persist([...nodes, node])
}

export const createFile = (parentId = null, position = null) =>
  createNode(parentId, 'file', 'New Text Document', '.txt', '', position)

export const createFolder = (parentId = null, position = null) =>
  createNode(parentId, 'folder', 'New Folder', '', '', position)

// Each mutation re-reads the latest stored list before writing so concurrent
// updates (e.g. Notepad editing content while an icon is dragged) don't clobber.
export const updateContent = (id, content) =>
  persist(loadNodes().map((n) => (n.id === id ? { ...n, content } : n)))

export const updatePosition = (id, x, y) =>
  persist(loadNodes().map((n) => (n.id === id ? { ...n, position: { x, y } } : n)))

export const renameNode = (id, name) =>
  persist(loadNodes().map((n) => (n.id === id ? { ...n, name } : n)))

// Collect a node id plus all of its descendants.
const withDescendants = (nodes, rootIds) => {
  const doomed = new Set(rootIds)
  let changed = true
  while (changed) {
    changed = false
    for (const n of nodes) {
      if (n.parentId && doomed.has(n.parentId) && !doomed.has(n.id)) {
        doomed.add(n.id)
        changed = true
      }
    }
  }
  return doomed
}

// Permanently remove a node and, for folders, everything beneath it.
export const deleteNode = (id) => {
  const nodes = loadNodes()
  const doomed = withDescendants(nodes, [id])
  return persist(nodes.filter((n) => !doomed.has(n.id)))
}

// --- Recycle Bin -----------------------------------------------------------
// Deleting moves an item to the bin (recoverable) rather than erasing it. Only
// the deleted node is flagged; its descendants stay put and are hidden because
// their ancestor is trashed, so restoring the node brings them back too.
export const trashNode = (id) =>
  persist(loadNodes().map((n) => (n.id === id ? { ...n, trashed: true } : n)))

export const trashedNodes = () => loadNodes().filter((n) => n.trashed)

export const restoreNode = (id) => {
  const nodes = loadNodes()
  return persist(
    nodes.map((n) => {
      if (n.id !== id) return n
      const parent = n.parentId ? nodes.find((p) => p.id === n.parentId) : null
      // If the original parent is gone or itself trashed, restore to the desktop.
      const parentId = parent && !parent.trashed ? n.parentId : null
      return { ...n, trashed: false, parentId }
    })
  )
}

// Permanently delete everything currently in the bin (and their descendants).
export const emptyTrash = () => {
  const nodes = loadNodes()
  const trashedIds = nodes.filter((n) => n.trashed).map((n) => n.id)
  const doomed = withDescendants(nodes, trashedIds)
  return persist(nodes.filter((n) => !doomed.has(n.id)))
}

// Is `nodeId` an ancestor of (or equal to) `maybeDescendantId`?
const isAncestor = (nodes, nodeId, maybeDescendantId) => {
  let current = nodes.find((n) => n.id === maybeDescendantId)
  while (current) {
    if (current.id === nodeId) return true
    current = current.parentId
      ? nodes.find((n) => n.id === current.parentId)
      : null
  }
  return false
}

// Move a node into a new folder. Returns the (possibly unchanged) node list.
// Rejects no-op and cycle-creating moves (a folder into itself or a descendant).
export const moveNode = (id, newParentId) => {
  const nodes = loadNodes()
  const node = nodes.find((n) => n.id === id)
  if (!node) return nodes
  if (node.parentId === newParentId) return nodes
  if (id === newParentId) return nodes
  // Moving a folder into one of its own descendants would orphan the subtree.
  if (newParentId && isAncestor(nodes, id, newParentId)) return nodes

  const siblings = nodes.filter((n) => n.parentId === newParentId && n.id !== id)
  const position = cascadePosition(siblings.length)
  return persist(
    nodes.map((n) => (n.id === id ? { ...n, parentId: newParentId, position } : n))
  )
}
