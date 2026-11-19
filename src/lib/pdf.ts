import type { jsPDF as JsPDF } from 'jspdf'
import { COLOUR_ROLES, hexToRgb } from './colour'
import { ASSET_CATEGORIES, LAYOUT_GROUPS, TECH_QUESTIONS, labelFor } from './options'
import type { OnboardingPayload } from './types'
import { formatBytes, formatDate } from './utils'
import { STATUS_META } from './agency-api'

const PAGE_W = 210
const PAGE_H = 297
const M = 18
const CONTENT_W = PAGE_W - M * 2
const INK: [number, number, number] = [12, 10, 9]
const MUTED: [number, number, number] = [120, 113, 108]
const LINE: [number, number, number] = [231, 229, 228]

/** Strips characters the built-in PDF fonts cannot render. */
function clean(text: string | null | undefined) {
  return (text ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/₹/g, 'Rs ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '')
}

export async function exportBriefPdf(p: OnboardingPayload) {
  const { jsPDF } = await import('jspdf')
  const doc: JsPDF = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = M

  const footer = () => {
    const pages = doc.getNumberOfPages()
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i)
      doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED)
      doc.text(`${clean(p.client.company_name)} - Creative brief - Idli Studios`, M, PAGE_H - 10)
      doc.text(`${i} / ${pages}`, PAGE_W - M, PAGE_H - 10, { align: 'right' })
    }
  }
  const ensure = (h: number) => {
    if (y + h > PAGE_H - 20) {
      doc.addPage()
      y = M
    }
  }
  const heading = (title: string) => {
    ensure(18)
    y += 4
    doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...INK)
    doc.text(title, M, y)
    y += 2.5
    doc.setDrawColor(...INK).setLineWidth(0.4).line(M, y, M + CONTENT_W, y)
    y += 6
  }
  const row = (label: string, value: string | null | undefined) => {
    const v = clean(value).trim() || '-'
    doc.setFont('helvetica', 'normal').setFontSize(9.5)
    const lines = doc.splitTextToSize(v, CONTENT_W - 52) as string[]
    const h = Math.max(1, lines.length) * 4.6 + 3
    ensure(h)
    doc.setTextColor(...MUTED).setFontSize(8.5).text(clean(label), M, y)
    doc.setTextColor(...INK).setFontSize(9.5).text(lines, M + 52, y)
    y += h
    doc.setDrawColor(...LINE).setLineWidth(0.2).line(M, y - 1.8, M + CONTENT_W, y - 1.8)
    y += 1.2
  }

  // ---- Cover
  doc.setFillColor(...INK).rect(0, 0, PAGE_W, 92, 'F')
  doc.setTextColor(250, 250, 249).setFont('helvetica', 'normal').setFontSize(9)
  doc.text('IDLI STUDIOS  -  CREATIVE BRIEF', M, 22)
  doc.setFont('helvetica', 'bold').setFontSize(28)
  doc.text(doc.splitTextToSize(clean(p.client.company_name), CONTENT_W) as string[], M, 50)
  doc.setFont('helvetica', 'normal').setFontSize(13).setTextColor(214, 211, 209)
  doc.text(clean(p.session.project_name), M, 70)
  doc.setFontSize(9)
  doc.text(
    `Status: ${STATUS_META[p.session.status].label}   |   Submitted: ${formatDate(p.session.submitted_at)}   |   Exported: ${formatDate(new Date().toISOString(), true)}`,
    M,
    82,
  )
  y = 106

  heading('Client')
  row('Company', p.business.company_name || p.client.company_name)
  row('Contact', [p.client.contact_name, p.client.email, p.client.phone].filter(Boolean).join('  -  '))

  heading('1. Business')
  row('About', p.business.about)
  row('Industry', p.business.industry)
  row('Products & services', p.business.offerings)
  row('Target audience', p.business.target_audience)
  row('Differentiators', p.business.differentiators)
  row('Current website', p.business.has_website === 'yes' ? p.business.website_url || 'Yes' : p.business.has_website === 'no' ? 'No' : '')
  row('Social links', p.business.social_links.filter(Boolean).join('\n'))

  heading('2. Project requirements')
  row('Project type', p.project.project_types.map(labelFor.projectType).join(', ') + (p.project.other_type ? ` - ${p.project.other_type}` : ''))
  row('Primary objective', p.project.objective)
  row('Functionality', p.project.functionality)
  row('Integrations', p.project.integrations)
  row('Timeline', [p.project.timeline, p.project.launch_date && `Launch ${p.project.launch_date}`].filter(Boolean).join('  -  '))
  row('Budget', p.project.budget_range)
  row('Expected outcome', p.project.expected_outcome)

  heading('3. Brand personality')
  row('Should feel', p.brand.personalities.map(labelFor.personality).join(', '))
  row('Notes', p.brand.notes)

  heading('4. Typography')
  row('Heading font', p.typography.heading_font)
  row('Body font', p.typography.body_font)
  row('Accent font', p.typography.accent_font || 'None (reuse heading)')
  if (p.typography.saved_combinations.length)
    row('Shortlisted', p.typography.saved_combinations.map((c) => `${c.heading} + ${c.body}${c.accent ? ` + ${c.accent}` : ''}`).join('\n'))
  row('Google Fonts', 'https://fonts.google.com/ - all selections are free Google Fonts')

  heading('5. Colour palette')
  ensure(34)
  const sw = (CONTENT_W - 4 * 4) / 5
  COLOUR_ROLES.forEach(({ role, label }, i) => {
    const hex = p.colours[role]
    const { r, g, b } = hexToRgb(hex)
    const x = M + i * (sw + 4)
    doc.setFillColor(r, g, b).setDrawColor(...LINE).setLineWidth(0.2).roundedRect(x, y, sw, 16, 1.5, 1.5, 'FD')
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...MUTED).text(label, x, y + 21)
    doc.setFont('courier', 'bold').setFontSize(9).setTextColor(...INK).text(hex, x, y + 25.5)
    doc.setFont('courier', 'normal').setFontSize(7).setTextColor(...MUTED).text(`rgb ${r} ${g} ${b}`, x, y + 29.5)
  })
  y += 36
  row('Palette', p.colours.preset ? `${p.colours.preset} preset` : 'Custom')

  heading('6. Layout preferences')
  LAYOUT_GROUPS.forEach((g) => row(g.label, labelFor.layout(g.key, p.layout[g.key])))
  row('Notes', p.layout.notes)

  heading('7. Website inspiration')
  const refs = p.inspiration.filter((r) => r.url || r.likes)
  if (!refs.length) row('References', '')
  refs.forEach((r, i) => row(`Reference ${i + 1}`, [r.url, r.likes && `Likes: ${r.likes}`, r.comment && `Comment: ${r.comment}`].filter(Boolean).join('\n')))

  heading('8. Competitors')
  const comps = p.competitors.items.filter((c) => c.name || c.url)
  if (!comps.length) row('Competitors', '')
  comps.forEach((c, i) => row(c.name || `Competitor ${i + 1}`, [c.url, c.likes && `Does well: ${c.likes}`, c.avoid && `Avoid: ${c.avoid}`].filter(Boolean).join('\n')))
  row('Avoid overall', p.competitors.notes)

  heading('9. Technical requirements')
  TECH_QUESTIONS.forEach((q) => {
    const a = p.technical.answers[q.key]
    const detail = q.detail && a === 'yes' ? p.technical[q.detail] : ''
    row(q.label.replace(/\?$/, ''), a ? `${a === 'unsure' ? 'Not sure' : a === 'yes' ? 'Yes' : 'No'}${detail ? ` - ${detail}` : ''}` : '')
  })
  row('Other notes', p.technical.notes)

  heading(`10. Uploaded assets (${p.assets.length})`)
  if (!p.assets.length) row('Files', '')
  p.assets.forEach((a) => row(ASSET_CATEGORIES.find((c) => c.id === a.category)?.label ?? a.category, `${a.file_name}  (${formatBytes(a.size_bytes)})`))

  if (p.client.notes) {
    heading('Internal notes')
    row('Team notes', p.client.notes)
  }

  footer()
  const safe = (p.client.company_name || 'client').replace(/[^\w-]+/g, '-').toLowerCase()
  doc.save(`${safe}-creative-brief.pdf`)
}
