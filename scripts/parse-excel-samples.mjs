// Parse sample Excel files to understand the format
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import XLSX from 'xlsx'

const BASE = 'contadores de febrero 2026'

// Read a few files from each ATC
const samples = [
  join(BASE, 'atc3', 'EJEMPLO.xlsx'),
  join(BASE, 'atc1', 'Bolip Sede Contadores Feb 2026.xlsx'),
  join(BASE, 'atc2', 'Relacion Anexa Taurel Feb 2026.xlsx'),
  join(BASE, 'atc3', 'RELACION ANEXA F. STANZIONE.xlsx'),
  join(BASE, 'atc2', 'Relacion Anexa K-NOB TRADING Feb 2026.xlsx'),
  join(BASE, 'atc3', 'RELACION ANEXA ALIMENTOS MACO.xlsx'),
]

for (const file of samples) {
  console.log('\n' + '='.repeat(80))
  console.log('FILE:', file)
  console.log('='.repeat(80))
  try {
    const buf = readFileSync(file)
    const wb = XLSX.read(buf, { type: 'buffer' })

    for (const sheetName of wb.SheetNames) {
      console.log(`\nSheet: "${sheetName}"`)
      const ws = wb.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

      // Print first 30 rows to see structure
      const maxRows = Math.min(rows.length, 35)
      for (let i = 0; i < maxRows; i++) {
        const row = rows[i]
        const cells = row.map((c, j) => `[${j}]${c}`).filter(c => !c.endsWith(']'))
        if (cells.length > 0) {
          console.log(`  R${i}: ${cells.join(' | ')}`)
        }
      }
      console.log(`  ... total rows: ${rows.length}`)
    }
  } catch (err) {
    console.log('  ERROR:', err.message)
  }
}

// Also list all files per ATC
console.log('\n\n' + '='.repeat(80))
console.log('ALL FILES:')
for (const atc of ['atc1', 'atc2', 'atc3']) {
  const dir = join(BASE, atc)
  try {
    const files = readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'))
    console.log(`\n${atc.toUpperCase()}: ${files.length} files`)
    files.forEach(f => console.log(`  - ${f}`))
  } catch (e) {}
}
