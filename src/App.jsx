import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import DatePage from './pages/DatePage'
import PlannerPage from './pages/PlannerPage'
import DayPage from './pages/DayPage'
import Header from './components/Header'
import { auth, db, googleProvider, hasFirebaseConfig } from './lib/firebase'
import { listenToUserTripData, saveUserTripData } from './lib/tripStore'

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

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }

  if (value && typeof value === 'object') {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    return `{${entries.join(',')}}`
  }

  return JSON.stringify(value)
}

function normalizePath(pathname) {
  if (!pathname) {
    return '/'
  }

  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return trimmed || '/'
}

function App() {
  const today = new Date()
  const defaultSelectedDateKey = createDateKey(today.getFullYear(), today.getMonth(), today.getDate())
  const [tripStartDate, setTripStartDate] = useState('')
  const [tripEndDate, setTripEndDate] = useState('')
  const [tripReady, setTripReady] = useState(false)
  const [tripSetupError, setTripSetupError] = useState('')
  const [selectedDateKey, setSelectedDateKey] = useState(defaultSelectedDateKey)
  const [stopsByDate, setStopsByDate] = useState({})
  const [authUser, setAuthUser] = useState(null)
  const [authReady, setAuthReady] = useState(!hasFirebaseConfig)
  const [tripDataReady, setTripDataReady] = useState(!hasFirebaseConfig)
  const [firebaseError, setFirebaseError] = useState('')
  const syncedTripSignatureRef = useRef('')

  const [route, setRoute] = useState(() => {
    try {
      return normalizePath(window.location.pathname || '/')
    } catch (e) {
      return '/'
    }
  })

  useEffect(() => {
    if (!hasFirebaseConfig) {
      setAuthReady(true)
      setTripDataReady(true)
      setFirebaseError('Add Firebase environment variables to enable Google sign-in and cloud sync.')
      return undefined
    }

    getRedirectResult(auth).catch((error) => {
      if (error instanceof Error) {
        setFirebaseError(error.message)
      }
    })

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user)
      setAuthReady(true)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!hasFirebaseConfig || !authReady) {
      return undefined
    }

    if (!authUser) {
      setTripStartDate('')
      setTripEndDate('')
      setSelectedDateKey(defaultSelectedDateKey)
      setStopsByDate({})
      setTripReady(false)
      setTripDataReady(true)
      syncedTripSignatureRef.current = ''
      return undefined
    }

    setTripDataReady(false)

    const unsubscribe = listenToUserTripData(db, authUser.uid, (tripData) => {
      const savedStart = tripData?.tripStartDate ?? ''
      const savedEnd = tripData?.tripEndDate ?? ''
      const savedSelectedDateKey = tripData?.selectedDateKey ?? savedStart ?? defaultSelectedDateKey
      const savedStopsByDate = tripData?.stopsByDate ?? {}
      const incomingSignature = stableStringify({
        tripStartDate: savedStart,
        tripEndDate: savedEnd,
        selectedDateKey: savedSelectedDateKey,
        stopsByDate: savedStopsByDate,
      })

      if (incomingSignature === syncedTripSignatureRef.current) {
        setTripDataReady(true)
        return
      }

      syncedTripSignatureRef.current = incomingSignature

      setTripStartDate(savedStart)
      setTripEndDate(savedEnd)
      setSelectedDateKey(savedSelectedDateKey)
      setStopsByDate(savedStopsByDate)
      setTripReady(Boolean(savedStart && savedEnd))
      setTripDataReady(true)
    })

    return unsubscribe
  }, [authReady, authUser, defaultSelectedDateKey])

  useEffect(() => {
    if (!hasFirebaseConfig || !authReady || !authUser || !tripDataReady) {
      return undefined
    }

    const outgoingSignature = stableStringify({
      tripStartDate,
      tripEndDate,
      selectedDateKey,
      stopsByDate,
    })

    if (outgoingSignature === syncedTripSignatureRef.current) {
      return undefined
    }

    syncedTripSignatureRef.current = outgoingSignature

    saveUserTripData(db, authUser.uid, {
      tripStartDate,
      tripEndDate,
      selectedDateKey,
      stopsByDate,
    }).catch(() => {
      setFirebaseError('Could not save trip data to Firebase. Check your project settings and Firestore rules.')
    })
    return undefined
  }, [authReady, authUser, tripDataReady, tripStartDate, tripEndDate, selectedDateKey, stopsByDate])

  useEffect(() => {
    const onPop = () => setRoute(normalizePath(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    // Send authenticated users with an initialized trip directly to the planner.
    if (authUser && tripDataReady && tripReady && route === '/') {
      navigate('/planner')
    }
  }, [authUser, tripDataReady, tripReady, route])

  function navigate(path) {
    const normalizedPath = normalizePath(path)
    const currentPath = normalizePath(window.location.pathname)

    if (currentPath !== normalizedPath) {
      window.history.pushState({}, '', path)
      setRoute(normalizedPath)
    }
  }

  async function handleGoogleSignIn() {
    if (!hasFirebaseConfig) return

    try {
      setFirebaseError('')
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

      if (isLocalhost) {
        await signInWithPopup(auth, googleProvider)
        return
      }

      await signInWithRedirect(auth, googleProvider)
    } catch (error) {
      const errorCode = error && typeof error === 'object' ? error.code : ''

      if (errorCode === 'auth/popup-blocked' || errorCode === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, googleProvider)
          return
        } catch (redirectError) {
          setFirebaseError(redirectError instanceof Error ? redirectError.message : 'Google sign-in failed.')
          return
        }
      }

      if (errorCode === 'auth/unauthorized-domain') {
        setFirebaseError(
          'Firebase blocked sign-in because this domain is not authorized. Add your Vercel domain and localhost to Firebase Authentication > Settings > Authorized domains, then redeploy.',
        )
        return
      }

      setFirebaseError(error instanceof Error ? error.message : 'Google sign-in failed.')
    }
  }

  async function handleSignOut() {
    if (!hasFirebaseConfig) return

    try {
      await signOut(auth)
      syncedTripSignatureRef.current = ''
    } catch (error) {
      setFirebaseError(error instanceof Error ? error.message : 'Sign out failed.')
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
  const isKnownRoute = route === '/' || route === '/planner' || route === '/day'

  if (!hasFirebaseConfig) {
    return (
      <main className="app-shell">
        <Header title="Firebase setup required">
          <p>
            Add your Firebase environment variables before using Google sign-in and cloud sync.
          </p>
        </Header>

        <section className="setup-card" aria-label="Firebase setup notice">
          <p className="setup-error">
            Missing Firebase config. For local development, create a <strong>.env</strong> file with
            the Vite Firebase variables. For Vercel, add the same <strong>VITE_FIREBASE_*</strong>
            values in the project Environment Variables settings, then redeploy.
          </p>
        </section>
      </main>
    )
  }

  if (!authReady) {
    return (
      <main className="app-shell">
        <section className="setup-card" aria-label="Loading Firebase state">
          <p>Loading your Firebase session...</p>
        </section>
      </main>
    )
  }

  if (!authUser) {
    return (
      <main className="app-shell">
        <Header title="Sign in to your trip planner">
          <p>Use Google sign-in to sync trip dates and stop details to Firebase.</p>
        </Header>

        <section className="setup-card auth-card" aria-label="Google sign in">
          <p className="auth-copy">
            Your trip information will be saved to your Firebase account instead of the browser.
          </p>
          <button type="button" className="primary-btn" onClick={handleGoogleSignIn}>
            Continue with Google
          </button>
          {firebaseError && <p className="setup-error">{firebaseError}</p>}
        </section>
      </main>
    )
  }

  if (!tripDataReady) {
    return (
      <main className="app-shell">
        <section className="setup-card" aria-label="Loading trip data">
          <p>Loading your trip data from Firebase...</p>
        </section>
      </main>
    )
  }

  if (!isKnownRoute) {
    return (
      <main className="app-shell">
        <div className="account-bar">
          <span>{authUser.displayName || authUser.email}</span>
          <button type="button" className="ghost-btn" onClick={handleSignOut}>
            Sign out
          </button>
        </div>

        <section className="planner-card">
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
        </section>
      </main>
    )
  }

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
        authUser={authUser}
        handleSignOut={handleSignOut}
      />
    )
  }

  return (
    <main className="app-shell">
      <div className="account-bar">
        <span>{authUser.displayName || authUser.email}</span>
        <button type="button" className="ghost-btn" onClick={handleSignOut}>
          Sign out
        </button>
      </div>

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
