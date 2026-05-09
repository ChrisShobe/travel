import React from 'react'

export default function Header({ eyebrow = 'Trip Timeline Planner', title, children }) {
  return (
    <header className="app-header">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children}
    </header>
  )
}
