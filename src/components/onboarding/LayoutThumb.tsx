import type { CSSProperties } from 'react'

const ink = '#1C1917'
const mid = '#A8A29E'
const soft = '#E7E5E4'

const bar = (w: string, h = 4, c = mid, extra: CSSProperties = {}): CSSProperties => ({ width: w, height: h, background: c, borderRadius: 2, ...extra })

/** Small schematic drawings that illustrate each layout option. */
export function LayoutThumb({ group, id, primary = ink }: { group: string; id: string; primary?: string }) {
  const box: CSSProperties = { position: 'relative', height: 92, background: '#FAFAF9', overflow: 'hidden', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }

  if (group === 'navigation') {
    const links = <div style={{ display: 'flex', gap: 5 }}>{[0, 1, 2].map((i) => <span key={i} style={bar('14px', 3)} />)}</div>
    const logo = <span style={bar('22px', 6, ink)} />
    const row: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 9px', background: '#fff', border: `1px solid ${soft}` }
    return (
      <div style={box}>
        {id === 'classic' && <div style={{ ...row, borderRadius: 4 }}>{logo}{links}<span style={bar('16px', 7, primary, { borderRadius: 3 })} /></div>}
        {id === 'centered' && <div style={{ ...row, borderRadius: 4 }}><div style={{ display: 'flex', gap: 5 }}><span style={bar('12px', 3)} /><span style={bar('12px', 3)} /></div>{logo}<div style={{ display: 'flex', gap: 5 }}><span style={bar('12px', 3)} /><span style={bar('12px', 3)} /></div></div>}
        {id === 'pill' && <div style={{ ...row, borderRadius: 99, margin: '4px 6px' }}>{logo}{links}<span style={bar('14px', 7, primary, { borderRadius: 99 })} /></div>}
        {id === 'minimal' && <div style={{ ...row, background: 'transparent', border: 'none' }}>{logo}<span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={bar('14px', 2, ink)} /><span style={bar('14px', 2, ink)} /><span style={bar('14px', 2, ink)} /></span></div>}
        <span style={bar('60%', 6, soft, { marginTop: 8 })} />
        <span style={bar('40%', 4, soft)} />
      </div>
    )
  }

  if (group === 'hero') {
    const img = (s: CSSProperties) => <span style={{ background: `linear-gradient(135deg, ${primary}, ${mid})`, borderRadius: 4, ...s }} />
    return (
      <div style={{ ...box, padding: 0 }}>
        {id === 'centered' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: 10 }}>
            <span style={bar('70%', 6, ink)} /><span style={bar('50%', 6, ink)} /><span style={bar('40%', 3)} />
            <div style={{ display: 'flex', gap: 4 }}><span style={bar('18px', 6, primary)} /><span style={bar('18px', 6, soft)} /></div>
            {img({ width: '80%', height: 20, marginTop: 2 })}
          </div>
        )}
        {id === 'split' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 10, height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, justifyContent: 'center' }}><span style={bar('90%', 6, ink)} /><span style={bar('70%', 6, ink)} /><span style={bar('80%', 3)} /><span style={bar('22px', 7, primary)} /></div>
            {img({ height: '100%' })}
          </div>
        )}
        {id === 'fullbleed' && (
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${primary}, ${mid})`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 5, padding: 10 }}>
            <span style={bar('70%', 6, '#fff')} /><span style={bar('50%', 3, '#ffffffaa')} /><span style={bar('22px', 7, '#fff')} />
          </div>
        )}
        {id === 'editorial' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 10 }}>
            <span style={bar('95%', 10, ink)} /><span style={bar('75%', 10, ink)} />
            {img({ width: '100%', height: 28, marginTop: 4 })}
          </div>
        )}
      </div>
    )
  }

  if (group === 'buttons') {
    const r = { rounded: 6, pill: 99, sharp: 0, outline: 6 }[id] ?? 6
    const filled: CSSProperties = id === 'outline' ? { border: `1.5px solid ${primary}`, color: primary, background: `${primary}12` } : { background: primary, color: '#fff' }
    return (
      <div style={{ ...box, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ ...filled, borderRadius: r, padding: '7px 16px', fontSize: 11, fontWeight: 600 }}>Get started</span>
        <span style={{ border: `1.5px solid ${soft}`, borderRadius: r, padding: '6px 14px', fontSize: 11, fontWeight: 600, color: ink }}>Learn more</span>
      </div>
    )
  }

  if (group === 'cards') {
    const style: CSSProperties =
      id === 'elevated' ? { background: '#fff', boxShadow: '0 4px 10px -4px rgba(0,0,0,0.25)', borderRadius: 6 }
      : id === 'filled' ? { background: soft, borderRadius: 6 }
      : id === 'minimal' ? { borderTop: `2px solid ${ink}`, borderRadius: 0, paddingTop: 6 }
      : { border: `1px solid ${mid}`, borderRadius: 6, background: '#fff' }
    return (
      <div style={{ ...box, flexDirection: 'row', alignItems: 'stretch', gap: 6 }}>
        {[0, 1].map((i) => (
          <div key={i} style={{ flex: 1, padding: id === 'minimal' ? 0 : 7, display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: primary }} />
            <span style={bar('80%', 4, ink)} /><span style={bar('90%', 3)} /><span style={bar('60%', 3)} />
          </div>
        ))}
      </div>
    )
  }

  if (group === 'sections') {
    const tile = (s: CSSProperties = {}) => <span style={{ background: soft, borderRadius: 3, ...s }} />
    return (
      <div style={box}>
        {id === 'grid' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, flex: 1 }}>{tile()}{tile()}{tile()}</div>}
        {id === 'bento' && <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr', gap: 5, flex: 1 }}>{tile()}{tile({ gridRow: 'span 2', background: primary, opacity: 0.6 })}{tile()}</div>}
        {id === 'alternating' && <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>{[0, 1].map((i) => <div key={i} style={{ display: 'flex', gap: 6, flexDirection: i ? 'row-reverse' : 'row', flex: 1 }}>{tile({ flex: 1, background: primary, opacity: 0.55 })}<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}><span style={bar('80%', 4, ink)} /><span style={bar('60%', 3)} /></div></div>)}</div>}
        {id === 'list' && <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1 }}>{[0, 1, 2, 3].map((i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: `1px solid ${soft}` }}><span style={bar('8px', 3)} /><span style={bar('35%', 4, ink)} /><span style={bar('30%', 3)} /></div>)}</div>}
      </div>
    )
  }

  if (group === 'images') {
    const r = { rounded: 10, sharp: 0, arch: '99px 99px 8px 8px', duotone: 10 }[id] ?? 10
    return (
      <div style={{ ...box, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 64, height: 70, borderRadius: r, overflow: 'hidden', position: 'relative', background: 'linear-gradient(160deg,#d6d3d1,#78716c)' }}>
          <span style={{ position: 'absolute', width: 26, height: 26, borderRadius: 99, background: '#f5f5f4', top: 14, left: 19 }} />
          <span style={{ position: 'absolute', width: 50, height: 30, borderRadius: '50% 50% 0 0', background: '#e7e5e4', bottom: -6, left: 7 }} />
          {id === 'duotone' && <span style={{ position: 'absolute', inset: 0, background: primary, mixBlendMode: 'color', opacity: 0.7 }} />}
        </div>
      </div>
    )
  }

  // footer
  return (
    <div style={{ ...box, justifyContent: 'flex-end' }}>
      <span style={bar('50%', 4, soft)} />
      {id === 'columns' && <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 6, borderTop: `1px solid ${soft}`, paddingTop: 6 }}><span style={bar('80%', 5, ink)} /><div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={bar('70%', 3)} /><span style={bar('60%', 3)} /></div><div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={bar('70%', 3)} /><span style={bar('60%', 3)} /></div></div>}
      {id === 'cta' && <div style={{ background: primary, borderRadius: 6, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}><span style={bar('80%', 6, '#fff')} /><span style={bar('20px', 6, '#ffffffcc')} /></div>}
      {id === 'simple' && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${soft}`, paddingTop: 8 }}><span style={bar('22px', 5, ink)} /><div style={{ display: 'flex', gap: 5 }}>{[0, 1, 2, 3].map((i) => <span key={i} style={bar('10px', 3)} />)}</div></div>}
      {id === 'minimal' && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${soft}`, paddingTop: 8 }}><span style={bar('18px', 5, ink)} /><span style={bar('30px', 3)} /></div>}
    </div>
  )
}
