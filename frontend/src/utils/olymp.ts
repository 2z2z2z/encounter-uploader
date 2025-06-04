export interface Cell { id?: string; rs?: number }

/** Generate layout for Олимпийка with given number of sectors (must be 2^k - 1). */
export function generateOlympLayout(total: number): Cell[][] {
  const k = Math.log2(total + 1)
  if (!Number.isInteger(k)) {
    throw new Error('total must be 2^k - 1')
  }
  const rows = 2 ** (k - 1)
  const pad = (n: number) => n.toString().padStart(2, '0')

  const layout: Cell[][] = Array.from({ length: rows }, () => [])
  for (let r = 0; r < rows; r++) {
    layout[r].push({ id: `01_${pad(r + 1)}` })
  }
  let nextId = rows + 1
  for (let c = 1; c < k; c++) {
    const rowspan = 2 ** c
    for (let r = 0; r < rows; r += rowspan) {
      layout[r].push({ id: `01_${pad(nextId++)}`, rs: rowspan })
    }
  }
  if (rows > 1) layout[1].push({})
  return layout
}
