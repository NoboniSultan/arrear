import { useRef, useState } from 'react';
import { formatCurrency, formatCurrencyCompact, formatMonthAbbrev } from '../../utils/formatters';
import styles from './RecoveryTrendChart.module.css';

const VIEW_WIDTH = 900;
const VIEW_HEIGHT = 300;
const LEFT_MARGIN = 56;
const BOTTOM_MARGIN = 28;
const TOP_MARGIN = 14;
const TICK_COUNT = 4;

function niceMax(max) {
  if (max <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const residual = max / magnitude;
  let niceResidual = 10;
  if (residual <= 1) niceResidual = 1;
  else if (residual <= 2) niceResidual = 2;
  else if (residual <= 5) niceResidual = 5;
  return niceResidual * magnitude;
}

export function RecoveryTrendChart({ data }) {
  const containerRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  const chartWidth = VIEW_WIDTH - LEFT_MARGIN;
  const chartHeight = VIEW_HEIGHT - BOTTOM_MARGIN - TOP_MARGIN;
  const maxValue = niceMax(Math.max(...data.map((d) => d.totalRecovered), 0));
  const bandWidth = chartWidth / data.length;
  const barWidth = Math.min(28, bandWidth * 0.55);
  const currentMonthIndex = data.length - 1;

  function handleEnter(index, evt) {
    const barRect = evt.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    setHovered({
      index,
      x: barRect.left - containerRect.left + barRect.width / 2,
      y: barRect.top - containerRect.top,
    });
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className="mono-label">Recovered by month · trailing {data.length}</span>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.swatchPaid} /> Paid
          </span>
          <span className={styles.legendItem}>
            <span className={styles.swatchProgress} /> Month in progress
          </span>
        </div>
      </div>

      <div className={styles.chartContainer} ref={containerRef}>
        <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className={styles.svg} role="img" aria-label="Recovered by month, trailing 12 months">
          {Array.from({ length: TICK_COUNT + 1 }).map((_, i) => {
            const value = (maxValue / TICK_COUNT) * i;
            const y = TOP_MARGIN + chartHeight - (value / maxValue) * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={LEFT_MARGIN}
                  x2={VIEW_WIDTH}
                  y1={y}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
                <text x={LEFT_MARGIN - 10} y={y + 4} textAnchor="end" className={styles.axisLabel}>
                  {value === 0 ? '0' : formatCurrencyCompact(value)}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const isCurrent = i === currentMonthIndex;
            const barHeight = maxValue > 0 ? (d.totalRecovered / maxValue) * chartHeight : 0;
            const x = LEFT_MARGIN + i * bandWidth + (bandWidth - barWidth) / 2;
            const y = TOP_MARGIN + chartHeight - barHeight;
            return (
              <g key={d.period}>
                <rect
                  x={x}
                  y={isCurrent ? y : y}
                  width={barWidth}
                  height={Math.max(barHeight, 1)}
                  fill={isCurrent ? 'var(--color-surface)' : 'var(--color-text-primary)'}
                  stroke={isCurrent ? 'var(--color-text-primary)' : 'none'}
                  strokeWidth={isCurrent ? 1 : 0}
                  vectorEffect="non-scaling-stroke"
                  onMouseEnter={(e) => handleEnter(i, e)}
                  onMouseLeave={() => setHovered(null)}
                  className={styles.bar}
                />
                <text
                  x={LEFT_MARGIN + i * bandWidth + bandWidth / 2}
                  y={VIEW_HEIGHT - 8}
                  textAnchor="middle"
                  className={`${styles.axisLabel} ${isCurrent ? styles.axisLabelCurrent : ''}`}
                >
                  {formatMonthAbbrev(d.period)}
                </text>
              </g>
            );
          })}
        </svg>

        {hovered && (
          <div
            className={styles.tooltip}
            style={{ left: hovered.x, top: hovered.y }}
          >
            <div className="mono-label">{formatMonthAbbrev(data[hovered.index].period)}</div>
            <div className={styles.tooltipValue}>{formatCurrency(data[hovered.index].totalRecovered)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
