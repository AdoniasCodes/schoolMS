import React from 'react'

export default function TeacherTablet(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 340 180" width="100%" height="100%" aria-hidden focusable={false} {...props}>
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="g2" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <rect x="8" y="20" rx="16" ry="16" width="324" height="152" fill="#0b1220" opacity="0.06" />
      <rect x="24" y="36" rx="14" ry="14" width="292" height="120" fill="url(#g1)" opacity="0.18" />
      <rect x="30" y="42" rx="12" ry="12" width="280" height="108" fill="#fff" opacity="0.88" />
      <rect x="30" y="42" rx="12" ry="12" width="280" height="108" fill="#0f1626" opacity="0.08" />
      <rect x="46" y="60" rx="10" ry="10" width="120" height="80" fill="url(#g2)" opacity="0.35" />
      <rect x="178" y="60" rx="10" ry="10" width="116" height="18" fill="#2563eb" opacity="0.18" />
      <rect x="178" y="84" rx="10" ry="10" width="116" height="12" fill="#2563eb" opacity="0.12" />
      <rect x="178" y="104" rx="10" ry="10" width="100" height="12" fill="#2563eb" opacity="0.12" />
      <circle cx="170" cy="30" r="2.5" fill="#64748b" />
    </svg>
  )
}
