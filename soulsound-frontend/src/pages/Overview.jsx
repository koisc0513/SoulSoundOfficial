import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usersApi } from '../api/index.js'
import { useAuth } from '../context/AuthContext'

const RANGE_OPTIONS = [
  { label: 'Last 7 days',  days: 7  },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

const CHIPS = [
  { key: 'plays',    icon: 'bi-play-circle-fill',  color: '#f5500a', label: 'plays',    total: 'totalPlays',    series: 'dailyPlays'    },
  { key: 'likes',    icon: 'bi-heart-fill',         color: '#e91e63', label: 'likes',    total: 'totalLikes',    series: 'dailyLikes'    },
  { key: 'comments', icon: 'bi-chat-fill',           color: '#2196F3', label: 'comments', total: 'totalComments', series: 'dailyComments' },
]

// ─────────────────────────────────────────────────────────────────
// AnalyticsChart — professional bar chart
// ─────────────────────────────────────────────────────────────────
function AnalyticsChart({ series = [], color = '#f5500a', label = '' }) {
  const [tooltip, setTooltip] = useState(null)
  const [hoverIdx, setHoverIdx] = useState(null)
  const svgRef = useRef(null)

  const n = series.length
  if (!n) return (
    <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.85rem' }}>
      No data for this period
    </div>
  )

  // Layout constants
  const VW     = 800
  const VH     = 220
  const PAD_L  = 48    // y-axis
  const PAD_R  = 16
  const PAD_T  = 20    // top
  const PAD_B  = 36    // x-axis labels
  const chartW = VW - PAD_L - PAD_R
  const chartH = VH - PAD_T - PAD_B

  const values  = series.map(d => Number(d.count) || 0)
  const maxVal  = Math.max(...values, 1)
  const total   = values.reduce((a, b) => a + b, 0)
  const avg     = total / n
  const peakIdx = values.indexOf(Math.max(...values))

  // Y-axis: 5 gridlines with nice round numbers
  const niceMax = (() => {
    if (maxVal <= 5)   return 5
    if (maxVal <= 10)  return 10
    if (maxVal <= 20)  return 20
    if (maxVal <= 50)  return 50
    if (maxVal <= 100) return 100
    const mag  = Math.pow(10, Math.floor(Math.log10(maxVal)))
    return Math.ceil(maxVal / mag) * mag
  })()
  const yTicks = [0, niceMax * 0.25, niceMax * 0.5, niceMax * 0.75, niceMax]
  const toY    = v => PAD_T + chartH - (v / niceMax) * chartH
  const avgY   = toY(avg)

  // X-axis: smart label step so labels never overlap
  // Always tick every day, label only every N days
  const labelStep = n <= 7 ? 1 : n <= 14 ? 2 : n <= 31 ? 5 : 10
  const slotW  = chartW / n
  const barW   = Math.max(slotW * 0.55, 3)
  const barMin = 2  // minimum visible bar height

  const gradId = `bar-grad-${color.replace('#','')}`

  // Tooltip position: clamp so it never bleeds outside SVG
  const tipW = 110, tipH = 46
  const getTipX = cx => Math.min(Math.max(cx - tipW / 2, PAD_L), VW - tipW - PAD_R)
  const getTipY = vy => Math.max(vy - tipH - 10, PAD_T)

  return (
    <div>
      {/* ── Summary row above chart ── */}
      <div style={{
        display: 'flex', gap: '24px', marginBottom: '16px',
        padding: '0 4px', flexWrap: 'wrap',
      }}>
        <Stat label="Total" value={total.toLocaleString()} color={color} />
        <Stat label="Daily avg" value={avg < 1 ? avg.toFixed(1) : Math.round(avg).toLocaleString()} />
        <Stat label="Peak" value={Math.max(...values).toLocaleString()} sub={series[peakIdx]?.label} />
        <Stat label="Active days" value={values.filter(v => v > 0).length + ' / ' + n} />
      </div>

      {/* ── SVG Chart ── */}
      <div style={{ position: 'relative', width: '100%' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          style={{ width: '100%', display: 'block', overflow: 'visible' }}
          onMouseLeave={() => { setTooltip(null); setHoverIdx(null) }}
        >
          <defs>
            {/* Bar gradient: accent → dimmer */}
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity="0.95" />
              <stop offset="100%" stopColor={color} stopOpacity="0.45" />
            </linearGradient>
            {/* Hover gradient: brighter */}
            <linearGradient id={`${gradId}-hover`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* ── Horizontal grid lines + Y labels ── */}
          {yTicks.map((v, ti) => {
            const gy = toY(v)
            return (
              <g key={ti}>
                <line
                  x1={PAD_L} y1={gy} x2={VW - PAD_R} y2={gy}
                  stroke={ti === 0 ? '#3a3a3a' : '#242424'}
                  strokeWidth={ti === 0 ? 1.5 : 1}
                  strokeDasharray={ti === 0 ? 'none' : '4 4'}
                />
                <text
                  x={PAD_L - 6} y={gy + 4}
                  textAnchor="end" fontSize="11"
                  fill="#555" fontFamily="Inter, sans-serif"
                >
                  {v >= 1000 ? (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + 'k' : v}
                </text>
              </g>
            )
          })}

          {/* ── Average line ── */}
          {avg > 0 && (
            <g>
              <line
                x1={PAD_L} y1={avgY} x2={VW - PAD_R} y2={avgY}
                stroke={color} strokeWidth="1"
                strokeDasharray="6 4" strokeOpacity="0.5"
              />
              <text
                x={VW - PAD_R + 2} y={avgY + 4}
                fontSize="9.5" fill={color} fillOpacity="0.7"
                fontFamily="Inter, sans-serif"
              >
                avg
              </text>
            </g>
          )}

          {/* ── Bars ── */}
          {series.map((d, i) => {
            const val  = values[i]
            const cx   = PAD_L + i * slotW + slotW / 2
            const bx   = cx - barW / 2
            const valH = val > 0 ? Math.max((val / niceMax) * chartH, barMin) : 0
            const valY = PAD_T + chartH - valH
            const isHover = hoverIdx === i
            const isPeak  = i === peakIdx && val > 0

            // X label: show every labelStep-th, always show first and last
            const showLabel = i % labelStep === 0 || i === n - 1

            return (
              <g key={d.date || i}>
                {/* Hover zone — invisible, full height */}
                <rect
                  x={bx - (slotW - barW) / 2} y={PAD_T}
                  width={slotW} height={chartH}
                  fill="transparent"
                  style={{ cursor: 'crosshair' }}
                  onMouseEnter={() => { setHoverIdx(i); setTooltip({ i, cx, valY, val, label: d.label }) }}
                />

                {/* Background track */}
                <rect
                  x={bx} y={PAD_T}
                  width={barW} height={chartH}
                  rx="3" fill="#1e1e1e"
                />

                {/* Value bar */}
                {val > 0 && (
                  <rect
                    x={bx} y={valY}
                    width={barW} height={valH}
                    rx="3"
                    fill={`url(#${isHover ? `${gradId}-hover` : gradId})`}
                    style={{ transition: 'fill 0.1s' }}
                  />
                )}

                {/* Peak crown dot */}
                {isPeak && val > 0 && (
                  <circle
                    cx={cx} cy={valY - 5}
                    r="3" fill={color} fillOpacity="0.9"
                  />
                )}

                {/* X-axis tick mark for every day */}
                <line
                  x1={cx} y1={PAD_T + chartH}
                  x2={cx} y2={PAD_T + chartH + 4}
                  stroke="#333" strokeWidth="1"
                />

                {/* X-axis label */}
                {showLabel && (
                  <text
                    x={cx} y={VH - 6}
                    textAnchor="middle" fontSize="10.5"
                    fill={isHover ? color : '#555'}
                    fontFamily="Inter, sans-serif"
                    style={{ transition: 'fill 0.1s' }}
                  >
                    {d.label}
                  </text>
                )}
              </g>
            )
          })}

          {/* ── Tooltip ── */}
          {tooltip && (
            <g style={{ pointerEvents: 'none' }}>
              {/* Vertical cursor line */}
              <line
                x1={tooltip.cx} y1={PAD_T}
                x2={tooltip.cx} y2={PAD_T + chartH}
                stroke={color} strokeWidth="1" strokeOpacity="0.4"
                strokeDasharray="3 3"
              />

              {/* Tooltip box */}
              <rect
                x={getTipX(tooltip.cx)}
                y={getTipY(tooltip.valY)}
                width={tipW} height={tipH}
                rx="6"
                fill="#1c1c1c" stroke={color}
                strokeWidth="1" strokeOpacity="0.6"
                filter="drop-shadow(0 2px 8px rgba(0,0,0,0.6))"
              />
              <text
                x={getTipX(tooltip.cx) + tipW / 2}
                y={getTipY(tooltip.valY) + 17}
                textAnchor="middle" fontSize="12"
                fill="#aaa" fontFamily="Inter, sans-serif"
              >
                {tooltip.label}
              </text>
              <text
                x={getTipX(tooltip.cx) + tipW / 2}
                y={getTipY(tooltip.valY) + 35}
                textAnchor="middle" fontSize="14"
                fontWeight="700"
                fill={color} fontFamily="Inter, sans-serif"
              >
                {tooltip.val.toLocaleString()} {label}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}

function Stat({ label, value, color, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span style={{
        fontSize: '1.1rem', fontWeight: '700',
        color: color || '#c0c0c0',
        fontFamily: 'Sora, Inter, sans-serif',
        lineHeight: 1,
      }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: '0.7rem', color: '#555', marginTop: '1px' }}>{sub}</span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main Overview
// ─────────────────────────────────────────────────────────────────
export default function Overview() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [data,        setData]        = useState(null)
  const [range,       setRange]       = useState(30)
  const [rangeOpen,   setRangeOpen]   = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [activeChip,  setActiveChip]  = useState('plays')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    load(range)
  }, [user, range])

  const load = async (d) => {
    setLoading(true)
    try {
      const res = await usersApi.getOverview(d)
      setData(res.data)
    } catch {}
    finally { setLoading(false) }
  }

  const rangeLabel = RANGE_OPTIONS.find(r => r.days === range)?.label ?? 'Last 30 days'

  const rangeStr = (() => {
    const end   = new Date()
    const start = new Date()
    start.setDate(start.getDate() - range + 1)
    const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${fmt(start)} – ${fmt(end)}`
  })()

  const activeChipDef = CHIPS.find(c => c.key === activeChip)

  return (
    <div className="overview-page">

      {/* ── Header ── */}
      <div className="overview-header">
        <h1 className="overview-title">Overview</h1>
        <div className="overview-range-wrap">
          <button className="overview-range-btn" onClick={() => setRangeOpen(o => !o)}>
            {rangeLabel} <i className="bi bi-chevron-down" />
          </button>
          {rangeOpen && (
            <div className="overview-range-dropdown">
              {RANGE_OPTIONS.map(opt => (
                <button
                  key={opt.days}
                  className={`overview-range-item${range === opt.days ? ' active' : ''}`}
                  onClick={() => { setRange(opt.days); setRangeOpen(false) }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="overview-loading">
          <i className="bi bi-arrow-repeat spin" /> Đang tải...
        </div>
      ) : !data ? null : (
        <>
          {/* ── Greeting ── */}
          <p className="overview-greeting">
            Hey <strong>{data.fullName}</strong>, you have{' '}
            <strong>{(data.totalPlays ?? 0).toLocaleString()} play{data.totalPlays !== 1 ? 's' : ''}</strong>{' '}
            in the last {range} days
          </p>

          {/* ── Meta row ── */}
          <div className="overview-meta-row">
            <span className="overview-meta-note">
              <i className="bi bi-clock" /> Data updates every 24 hours
            </span>
            <span className="overview-meta-range">{rangeStr}</span>
          </div>

          {/* ── Chips ── */}
          <div className="ov-chips-row">
            {CHIPS.map(chip => (
              <button
                key={chip.key}
                className={`ov-chip${activeChip === chip.key ? ' ov-chip--active' : ''}`}
                style={activeChip === chip.key ? { borderColor: chip.color } : {}}
                onClick={() => setActiveChip(chip.key)}
              >
                <i
                  className={`bi ${chip.icon}`}
                  style={{ color: activeChip === chip.key ? chip.color : undefined }}
                />
                <span>
                  {(data[chip.total] ?? 0).toLocaleString()} {chip.label}
                </span>
              </button>
            ))}
          </div>

          {/* ── Chart card ── */}
          {activeChipDef && (
            <div className="ov-chart-card">
              {/* Card header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: '20px',
              }}>
                <div>
                  <div style={{
                    fontSize: '0.7rem', color: '#555',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px',
                  }}>
                    Daily {activeChipDef.label}
                  </div>
                  <div style={{
                    fontSize: '1.6rem', fontWeight: '800',
                    fontFamily: 'Sora, Inter, sans-serif',
                    color: activeChipDef.color, lineHeight: 1,
                  }}>
                    {(data[activeChipDef.total] ?? 0).toLocaleString()}
                    <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#555', marginLeft: '8px' }}>
                      total
                    </span>
                  </div>
                </div>
                <div style={{
                  fontSize: '0.75rem', color: '#555',
                  background: '#1a1a1a', border: '1px solid #2a2a2a',
                  borderRadius: '6px', padding: '6px 10px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <i className="bi bi-calendar3" style={{ color: activeChipDef.color, opacity: 0.7 }} />
                  {rangeStr}
                </div>
              </div>

              <AnalyticsChart
                series={data[activeChipDef.series] ?? []}
                color={activeChipDef.color}
                label={activeChipDef.label}
              />
            </div>
          )}

          {/* ── Two-column grid ── */}
          <div className="overview-grid">

            {/* Top Tracks */}
            <div className="overview-card">
              <div className="overview-card__title">
                <i className="bi bi-bar-chart-fill" /> Top tracks
                <span className="overview-card__sub">Last {range} days</span>
              </div>
              {(data.topTracks ?? []).length === 0 ? (
                <p className="overview-empty">Chưa có dữ liệu.</p>
              ) : (
                <div className="overview-track-list">
                  {data.topTracks.map((t, i) => (
                    <Link key={t.id} to={`/tracks/${t.id}`} className="ov-track-row">
                      <span className="ov-track-row__rank">{i + 1}</span>
                      <img
                        className="ov-track-row__thumb"
                        src={t.thumbnailUrl || '/images/default-thumb.png'}
                        onError={e => { e.target.src = '/images/default-thumb.png' }}
                        alt={t.title}
                      />
                      <div className="ov-track-row__info">
                        <span className="ov-track-row__title">{t.title}</span>
                        <span className="ov-track-row__artist">{t.artist}</span>
                      </div>
                      <div className="ov-track-row__stats">
                        <span><i className="bi bi-play-fill" /> {t.playCount?.toLocaleString()}</span>
                        <span><i className="bi bi-heart-fill" /> {t.likeCount?.toLocaleString()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Top Listeners */}
            <div className="overview-card">
              <div className="overview-card__title">
                <i className="bi bi-people-fill" /> Top listeners
                <span className="overview-card__sub">Last {range} days</span>
              </div>
              {(data.topListeners ?? []).length === 0 ? (
                <p className="overview-empty">Chưa có dữ liệu.</p>
              ) : (
                <div className="overview-listener-list">
                  {data.topListeners.map((u, i) => (
                    <Link key={u.id} to={`/profile/${u.email}`} className="ov-listener-row">
                      <span className="ov-listener-row__rank">{i + 1}</span>
                      <img
                        className="ov-listener-row__avatar"
                        src={u.avatarUrl || '/images/default-avatar.png'}
                        onError={e => { e.target.src = '/images/default-avatar.png' }}
                        alt={u.fullName}
                      />
                      <div className="ov-listener-row__info">
                        <span className="ov-listener-row__name">{u.fullName}</span>
                      </div>
                      <div className="ov-listener-row__count">
                        <i className="bi bi-play-circle-fill" /> {u.listenCount?.toLocaleString()}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  )
}