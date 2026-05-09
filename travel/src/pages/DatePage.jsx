import React from 'react'
import Header from '../components/Header'

export default function DatePage({
  tripStartDate,
  tripEndDate,
  setTripStartDate,
  setTripEndDate,
  tripSetupError,
  handleTripSetupSubmit,
  tripReady,
  navigate,
}) {
  return (
    <main className="app-shell">
      <Header title="Set your trip dates">
        <p>
          Choose the start and end dates for your trip so the planner only shows
          the days you actually want to use.
        </p>
      </Header>

      <section className="setup-card" aria-label="Trip date setup">
        <form className="setup-form" onSubmit={handleTripSetupSubmit}>
          <label>
            Travel start date
            <input
              type="date"
              value={tripStartDate}
              onChange={(event) => {
                setTripStartDate(event.target.value)
              }}
              required
            />
          </label>

          <label>
            Travel end date
            <input
              type="date"
              value={tripEndDate}
              min={tripStartDate || undefined}
              onChange={(event) => {
                setTripEndDate(event.target.value)
              }}
              required
            />
          </label>

          {tripSetupError && <p className="setup-error">{tripSetupError}</p>}

          <div className="setup-actions">
            <button type="submit" className="primary-btn setup-submit-btn">
              Open planner
            </button>
            {tripReady && (
              <button
                type="button"
                className="ghost-btn"
                onClick={() => navigate('/planner')}
              >
                Back to planner
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  )
}
