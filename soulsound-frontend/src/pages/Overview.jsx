import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usersApi } from '../api/index.js'
import { useAuth } from '../context/AuthContext'

const RANGE_OPTIONS = [
  { label: 'Last 7 days',  days: 7  },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

// ── Bar Chart SVG ─────────────────────────────────────────────────
// viewBox cố định 600×170, tọa độ pixels rõ ràng, không distort

function BarChart({ series = [], color = '#ff5500' }) {
  const wrapRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)

  const VW = 600          // viewBox width
  const VH = 170          // viewBox height
  const PAD_L  = 28       // y-axis area
  const PAD_B  = 28       // x-axis labels
  const PAD_R  = 8
  const chartW = VW - PAD_L - PAD_R
  const chartH = VH - PAD_B

  const n = series.length
  if (!n) return null

  const maxVal   = Math.max(...series.map(d => Number(d.count)), 1)
  const barW     = (chartW / n) * 0.55
  const slotW    = chartW / n
  const labelStep = n <= 10 ? 1 : n <= 20 ? 2 : 3

  const yAxisTicks = [0, Math.round(maxVal / 2), maxVal]
  const toY = v => chartH - (v / maxVal) * chartH

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ width: '100%', display: 'block' }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Y-axis ticks */}
        {yAxisTicks.map(v => (
          <text
            key={v}
            x={PAD_L - 4}
            y={toY(v) + 4}
            textAnchor="end"
            fontSize="11"
            fill="#888"
            fontFamily="sans-serif"
          >
            {v}
          </text>
        ))}

        {/* Bars */}
        {series.map((d, i) => {
          const cx   = PAD_L + i * slotW + slotW / 2
          const bx   = cx - barW / 2
          const val  = Number(d.count)
          const valH = val > 0 ? (val / maxVal) * chartH : 0
          const valY = toY(val)
          const showLbl = i % labelStep === 0

          return (
            <g key={d.date}>
              {/* Gray background bar */}
              <rect
                x={bx} y={0}
                width={barW} height={chartH}
                rx="3" fill="#333"
              />
              {/* Colored value bar */}
              {val > 0 && (
                <rect
                  x={bx} y={valY}
                  width={barW} height={valH}
                  rx="3" fill={color}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setTooltip({ i, label: d.label, count: val, cx, valY })}
                  onMouseLeave={() => setTooltip(null)}
                />
              )}
              {/* X label */}
              {showLbl && (
                <text
                  x={cx} y={VH - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#888"
                  fontFamily="sans-serif"
                >
                  {d.label}
                </text>
              )}
            </g>
          )
        })}

        {/* Inline tooltip (SVG foreignObject so it stays in-flow) */}
        {tooltip && (
          <g>
            <rect
              x={Math.min(tooltip.cx - 36, VW - 80)} y={Math.max(tooltip.valY - 34, 2)}
              width={74} height={26}
              rx="5"
              fill="#222" stroke="#444" strokeWidth="1"
            />
            <text
              x={Math.min(tooltip.cx, VW - 40)} y={Math.max(tooltip.valY - 16, 16)}
              textAnchor="middle" fontSize="11"
              fill="#fff" fontFamily="sans-serif"
            >
              {tooltip.count} · {tooltip.label}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

// ── Main Overview ─────────────────────────────────────────────────

const CHIPS = [
  { key: 'plays',    icon: 'bi-play-circle-fill',  color: '#ff5500', label: 'plays',    total: 'totalPlays',    series: 'dailyPlays'    },
  { key: 'likes',    icon: 'bi-heart-fill',         color: '#e91e63', label: 'likes',    total: 'totalLikes',    series: 'dailyLikes'    },
  { key: 'comments', icon: 'bi-chat-fill',           color: '#2196F3', label: 'comments', total: 'totalComments', series: 'dailyComments' },
]

export default function Overview() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [data,        setData]        = useState(null)
  const [range,       setRange]       = useState(30)
  const [rangeOpen,   setRangeOpen]   = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [activeChip,  setActiveChip]  = useState('plays')   // which chart to show

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
    return `${fmt(start)} - ${fmt(end)}`
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

          {/* ── Chips — click to switch chart ── */}
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

          {/* ── Active chart ── */}
          {activeChipDef && (
            <div className="ov-chart-card">
              <BarChart
                series={data[activeChipDef.series] ?? []}
                color={activeChipDef.color}
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
                        <i className="bi bi-heart-fill" /> {u.likeCount}
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