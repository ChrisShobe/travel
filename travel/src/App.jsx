import { useEffect, useMemo, useState } from 'react'
import DatePage from './pages/DatePage'
import PlannerPage from './pages/PlannerPage'
import DayPage from './pages/DayPage'
import Header from './components/Header'

function createDateKey(year, monthIndex, day) {
  const month = String(monthIndex + 1).padStart(2, '0')
  const date = String(day).padStart(2, '0')
  return `${year}-${month}-${date}`
}

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60) % 24
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function formatTimeWithAmPm(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const amPm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${amPm}`
}

function parseDuration(durationStr) {
  const str = durationStr.toLowerCase().trim()
  
  // Try to parse "X hours", "X mins", "X hours Y mins", etc.
  let totalMins = 0
  
  // Match hours
  const hourMatch = str.match(/(\d+)\s*h(?:our)?s?/)
  if (hourMatch) {
    totalMins += parseInt(hourMatch[1], 10) * 60
  }
  
  // Match minutes
  const minMatch = str.match(/(\d+)\s*m(?:in)?s?/)
  if (minMatch) {
    totalMins += parseInt(minMatch[1], 10)
  }
  
  return totalMins
}

function detectOverlap(stop1, stop2) {
  const start1 = timeToMinutes(stop1.time)
  const end1 = start1 + parseDuration(stop1.stayDuration || '0')
  
  const start2 = timeToMinutes(stop2.time)
  const end2 = start2 + parseDuration(stop2.stayDuration || '0')
  
  // Check if stops overlap
  return !(end1 <= start2 || end2 <= start1)
}

function findNextFreeSlot(stops, proposedTime, duration) {
  let currentMinutes = timeToMinutes(proposedTime)
  const durationMins = parseDuration(duration || '0')
  
  // Sort stops by time
  const sortedStops = [...stops].sort((a, b) => 
    timeToMinutes(a.time) - timeToMinutes(b.time)
  )
  
  for (const stop of sortedStops) {
    const stopStart = timeToMinutes(stop.time)
    const stopDuration = parseDuration(stop.stayDuration || '0')
    const stopEnd = stopStart + stopDuration
    
    const currentEnd = currentMinutes + durationMins
    
    // If current slot overlaps with this stop, move to after this stop
    if (!(currentEnd <= stopStart || currentMinutes >= stopEnd)) {
      currentMinutes = stopEnd
    }
  }
  
  return minutesToTime(currentMinutes)
}

function formatDurationFromDropdowns(hours, minutes) {
  const parts = []
  if (parseInt(hours, 10) > 0) parts.push(`${hours} hour${hours !== '1' ? 's' : ''}`)
  if (parseInt(minutes, 10) > 0) parts.push(`${minutes} min${minutes !== '1' ? 's' : ''}`)
  return parts.length > 0 ? parts.join(' ') : '0 mins'
}

function splitDurationIntoDropdowns(durationStr) {
  const totalMinutes = parseDuration(durationStr)
  return {
    hours: String(Math.floor(totalMinutes / 60)),
    minutes: String(totalMinutes % 60),
  }
}

function formatTripDayLabel(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function App() {
  const today = new Date()
  const [tripStartDate, setTripStartDate] = useState('')
  const [tripEndDate, setTripEndDate] = useState('')
  const [tripReady, setTripReady] = useState(false)
  const [tripSetupError, setTripSetupError] = useState('')
  const [selectedDateKey, setSelectedDateKey] = useState(
    createDateKey(today.getFullYear(), today.getMonth(), today.getDate()),
  )
  const [stopsByDate, setStopsByDate] = useState({})

  const [route, setRoute] = useState(() => {
    try {
      return window.location.pathname || '/'
    } catch (e) {
      return '/'
    }
  })

  // Load saved trip data from localStorage on mount so direct URLs work
  useEffect(() => {
    try {
      const savedStart = localStorage.getItem('tripStartDate')
      const savedEnd = localStorage.getItem('tripEndDate')
      const savedStops = localStorage.getItem('stopsByDate')

      if (savedStart) setTripStartDate(savedStart)
      if (savedEnd) setTripEndDate(savedEnd)
      if (savedStart) setSelectedDateKey(savedStart)
      if (savedStops) setStopsByDate(JSON.parse(savedStops))

      if (savedStart && savedEnd) {
        setTripReady(true)
      }
    } catch (err) {
      // ignore
    }
  }, [])

  // Persist trip data to localStorage when it changes
  useEffect(() => {
    try {
      if (tripStartDate) {
        localStorage.setItem('tripStartDate', tripStartDate)
      } else {
        localStorage.removeItem('tripStartDate')
      }

      if (tripEndDate) {
        localStorage.setItem('tripEndDate', tripEndDate)
      } else {
        localStorage.removeItem('tripEndDate')
      }

      localStorage.setItem('stopsByDate', JSON.stringify(stopsByDate || {}))
    } catch (err) {
      // ignore
    }
  }, [tripStartDate, tripEndDate, stopsByDate])

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  function navigate(path) {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
      setRoute(path)
    }
  }

  const selectedDate = useMemo(() => {
    const [dateYear, dateMonth, dateDay] = selectedDateKey.split('-').map(Number)
    return new Date(dateYear, dateMonth - 1, dateDay)
  }, [selectedDateKey])

  const selectedDateLabel = useMemo(() => {
    return selectedDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }, [selectedDate])

  const tripRangeLabel = useMemo(() => {
    if (!tripStartDate || !tripEndDate) {
      return ''
    }

    const startLabel = new Date(`${tripStartDate}T00:00:00`).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const endLabel = new Date(`${tripEndDate}T00:00:00`).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    return `${startLabel} to ${endLabel}`
  }, [tripStartDate, tripEndDate])

  const tripDays = useMemo(() => {
    if (!tripReady) {
      return []
    }

    const days = []
    const currentDate = new Date(`${tripStartDate}T00:00:00`)
    const endDate = new Date(`${tripEndDate}T00:00:00`)

    while (currentDate <= endDate) {
      const year = currentDate.getFullYear()
      const monthIndex = currentDate.getMonth()
      const day = currentDate.getDate()
      const dateKey = createDateKey(year, monthIndex, day)

      days.push({
        dateKey,
        label: formatTripDayLabel(dateKey),
        stopCount: (stopsByDate[dateKey] ?? []).length,
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days
  }, [stopsByDate, tripEndDate, tripReady, tripStartDate])

  // stop form init moved to DayPage

  useEffect(() => {
    // Ensure selected date remains in range when trip dates change
    if (!tripReady) {
      return
    }

    if (selectedDateKey < tripStartDate) {
      setSelectedDateKey(tripStartDate)
    }
  }, [tripReady, selectedDateKey, tripStartDate])

  function handleTripSetupSubmit(event) {
    event.preventDefault()

    if (!tripStartDate || !tripEndDate) {
      setTripSetupError('Please choose both a start date and an end date.')
      return
    }

    if (tripEndDate < tripStartDate) {
      setTripSetupError('End date must be on or after the start date.')
      return
    }

    setSelectedDateKey(tripStartDate)
    setTripReady(true)
    setTripSetupError('')
    navigate('/planner')
  }

  function openTripSetup() {
    // Navigate to the date setup page so the user can change dates
    navigate('/')
  }

  const selectedDateStops = stopsByDate[selectedDateKey] ?? []

  if (!tripReady || route === '/') {
    return (
      <DatePage
        tripStartDate={tripStartDate}
        tripEndDate={tripEndDate}
        setTripStartDate={setTripStartDate}
        setTripEndDate={setTripEndDate}
        tripSetupError={tripSetupError}
        handleTripSetupSubmit={handleTripSetupSubmit}
        tripReady={tripReady}
        navigate={navigate}
      />
    )
  }

  return (
    <main className="app-shell">
      {route === '/day' && (
        <Header title={`Stops for ${selectedDateLabel}`}>
          <p>Manage stops for {selectedDateLabel}: add times, durations, notes, and photos.</p>
        </Header>
      )}

      <section className="board" aria-label="Travel planning board">
        {route === '/planner' && (
          <PlannerPage
            tripRangeLabel={tripRangeLabel}
            tripDays={tripDays}
            setSelectedDateKey={setSelectedDateKey}
            navigate={navigate}
            openTripSetup={openTripSetup}
          />
        )}

        {route === '/day' && (
          <div className="planner-card full-width">
            <DayPage
              selectedDateLabel={selectedDateLabel}
              selectedDateStops={selectedDateStops}
              stopsByDate={stopsByDate}
              setStopsByDate={setStopsByDate}
              selectedDateKey={selectedDateKey}
              navigate={navigate}
              timeToMinutes={timeToMinutes}
              parseDuration={parseDuration}
              minutesToTime={minutesToTime}
              formatDurationFromDropdowns={formatDurationFromDropdowns}
              splitDurationIntoDropdowns={splitDurationIntoDropdowns}
              formatTimeWithAmPm={formatTimeWithAmPm}
              findNextFreeSlot={findNextFreeSlot}
              detectOverlap={detectOverlap}
            />
          </div>
        )}

        {route !== '/planner' && route !== '/day' && (
          <div className="planner-card">
            <h2>404 — Page not found</h2>
            <p>
              The page <strong>{route}</strong> does not exist.
            </p>
            <div className="notfound-actions">
              <button
                type="button"
                className="inline-photo-upload back-to-days"
                onClick={() => navigate('/planner')}
              >
                Back to planner
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
