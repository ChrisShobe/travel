import React from 'react'

export default function PlannerPage({
  tripRangeLabel,
  tripDays,
  setSelectedDateKey,
  navigate,
  openTripSetup,
}) {
  return (
    <div className="calendar-card full-width">
      <div className="calendar-header">
        <div className="calendar-header-left">
          <h2>Trip days</h2>
          <p>{tripRangeLabel}</p>
          <p className="planner-help-text">
            Click a day to view or add stops for that date. The number shows how
            many stops are scheduled for each day.
          </p>
        </div>

        <div className="calendar-header-controls">
          <button
            type="button"
            className="inline-photo-upload change-dates-btn"
            onClick={openTripSetup}
          >
            Change dates
          </button>
        </div>
      </div>

      <div className="trip-day-grid" role="list" aria-label="Trip days">
        {tripDays.map((day) => {
          const isSelected = false

          return (
            <button
              key={day.dateKey}
              type="button"
              className={`trip-day-button ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                setSelectedDateKey(day.dateKey)
                navigate('/day')
              }}
            >
              <span className="trip-day-label">{day.label}</span>
              {day.stopCount > 0 && (
                <small>
                  {day.stopCount} stop{day.stopCount > 1 ? 's' : ''}
                </small>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
