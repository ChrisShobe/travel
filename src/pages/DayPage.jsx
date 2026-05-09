import React, { useEffect, useState } from 'react'

export default function DayPage({
  selectedDateLabel,
  selectedDateStops,
  stopsByDate,
  setStopsByDate,
  selectedDateKey,
  navigate,
  timeToMinutes,
  parseDuration,
  minutesToTime,
  formatDurationFromDropdowns,
  splitDurationIntoDropdowns,
  formatTimeWithAmPm,
  findNextFreeSlot,
  detectOverlap,
}) {
  const [stopName, setStopName] = useState('')
  const [stopTime, setStopTime] = useState('09:00')
  const [distance, setDistance] = useState('')
  const [stayHours, setStayHours] = useState('0')
  const [stayMinutes, setStayMinutes] = useState('30')
  const [interestingInfo, setInterestingInfo] = useState('')
  const [photoFiles, setPhotoFiles] = useState([])
  const [editingStop, setEditingStop] = useState(null)

  useEffect(() => {
    if (editingStop) return
    if ((selectedDateStops ?? []).length > 0) {
      const lastStop = selectedDateStops[selectedDateStops.length - 1]
      const lastStopEndMinutes = timeToMinutes(lastStop.time) + parseDuration(lastStop.stayDuration || '0')
      setStopTime(minutesToTime(lastStopEndMinutes))
    } else {
      setStopTime('09:00')
    }
  }, [selectedDateStops, editingStop, timeToMinutes, parseDuration, minutesToTime])

  function onPhotoUpload(event) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    const photoItems = files.map((file) => ({
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      isTemp: true,
    }))

    setPhotoFiles((current) => [...current, ...photoItems])
    event.target.value = ''
  }

  function removePhoto(indexToDelete) {
    setPhotoFiles((currentFiles) => {
      const target = currentFiles[indexToDelete]
      if (target?.isTemp && target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return currentFiles.filter((_, i) => i !== indexToDelete)
    })
  }

  function startEditingStop(dateKey, stopId) {
    const stopToEdit = (stopsByDate[dateKey] ?? []).find((s) => s.id === stopId)
    if (!stopToEdit) return

    const durationParts = splitDurationIntoDropdowns(stopToEdit.stayDuration || '0 mins')

    setEditingStop({ dateKey, stopId })
    setStopName(stopToEdit.name)
    setStopTime(stopToEdit.time)
    setDistance(stopToEdit.distance || '')
    setStayHours(durationParts.hours)
    setStayMinutes(durationParts.minutes)
    setInterestingInfo(stopToEdit.interestingInfo || '')
    setPhotoFiles((stopToEdit.photos ?? []).map((p) => ({ ...p, isTemp: false })))
  }

  function handleStopPhotoUpload(dateKey, stopId, event) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    const newPhotos = files.map((file) => ({ name: file.name, previewUrl: URL.createObjectURL(file) }))

    setStopsByDate((current) => {
      const updatedStops = (current[dateKey] ?? []).map((stop) =>
        stop.id === stopId ? { ...stop, photos: [...(stop.photos ?? []), ...newPhotos] } : stop,
      )
      return { ...current, [dateKey]: updatedStops }
    })

    if (editingStop?.dateKey === dateKey && editingStop?.stopId === stopId) {
      setPhotoFiles((current) => [...current, ...newPhotos.map((p) => ({ ...p, isTemp: false }))])
    }

    event.target.value = ''
  }

  function resetForm() {
    setStopName('')
    setStopTime('09:00')
    setDistance('')
    setStayHours('0')
    setStayMinutes('30')
    setInterestingInfo('')
    photoFiles.forEach((photo) => {
      if (photo.isTemp) URL.revokeObjectURL(photo.previewUrl)
    })
    setPhotoFiles([])
    setEditingStop(null)
  }

  function addStop(event) {
    event.preventDefault()

    const dateKey = editingStop?.dateKey ?? selectedDateKey
    const existingStops = (stopsByDate[dateKey] ?? []).filter((s) => s.id !== editingStop?.stopId)
    const stayDurationStr = formatDurationFromDropdowns(stayHours, stayMinutes)

    let finalTime = stopTime
    const tempStop = { time: stopTime, stayDuration: stayDurationStr }
    const hasOverlap = existingStops.some((s) => detectOverlap(tempStop, s))
    if (hasOverlap) finalTime = findNextFreeSlot(existingStops, stopTime, stayDurationStr)

    const stop = {
      id: editingStop?.stopId ?? `${dateKey}-${Date.now()}`,
      name: stopName.trim() || 'Unnamed stop',
      time: finalTime,
      distance: distance.trim(),
      stayDuration: stayDurationStr,
      interestingInfo: interestingInfo.trim(),
      photos: photoFiles.map(({ isTemp, ...p }) => p),
    }

    setStopsByDate((current) => {
      const existingStopsForDate = current[dateKey] ?? []
      const updatedStops = editingStop
        ? existingStopsForDate.map((s) => (s.id === stop.id ? stop : s)).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
        : [...existingStopsForDate, stop].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))

      return { ...current, [dateKey]: updatedStops }
    })

    resetForm()
  }
  return (
    <>
      <section className="stop-form-section">
        <div className="day-back-wrap">
          <button
            type="button"
            className="inline-photo-upload back-to-days"
            onClick={() => navigate('/planner')}
          >
            Back to days
          </button>
        </div>
        <h2>{editingStop ? `Edit stop for ${selectedDateLabel}` : `Add stop for ${selectedDateLabel}`}</h2>
        <form onSubmit={addStop} className="stop-form">
          <label>
            Stop name
            <input
              type="text"
              placeholder="Old Town, Museum, Beach..."
              value={stopName}
              onChange={(event) => setStopName(event.target.value)}
            />
          </label>

          <div className="split-fields">
            <label>
              Arrival time
              <input
                type="time"
                value={stopTime}
                onChange={(event) => setStopTime(event.target.value)}
                required
              />
            </label>

            <label>
              Distance to get there
              <input
                type="text"
                placeholder="18 km or 25 min drive"
                value={distance}
                onChange={(event) => setDistance(event.target.value)}
              />
            </label>
          </div>

          <label>
            Time to stay there
            <div className="duration-dropdowns">
              <select value={stayHours} onChange={(event) => setStayHours(event.target.value)}>
                {[...Array(24)].map((_, i) => (
                  <option key={i} value={String(i)}>
                    {i} hour{i !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>

              <select value={stayMinutes} onChange={(event) => setStayMinutes(event.target.value)}>
                {[0, 5, 10, 15, 20, 25, 30, 45].map((min) => (
                  <option key={min} value={String(min)}>
                    {min} min{min !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label>
            Interesting information
            <textarea
              rows="3"
              placeholder="What is special about this stop?"
              value={interestingInfo}
              onChange={(event) => setInterestingInfo(event.target.value)}
            />
          </label>

          <label className="inline-photo-upload">
            Add photos
            <input type="file" accept="image/*" multiple onChange={onPhotoUpload} />
          </label>

          {photoFiles.length > 0 && (
            <div className="photo-preview-grid">
              {photoFiles.map((photo, index) => (
                <article key={`${photo.name}-${index}`} className="preview-card">
                  <img src={photo.previewUrl} alt={photo.name} />
                  <button type="button" onClick={() => removePhoto(index)} className="remove-photo">
                    Remove
                  </button>
                </article>
              ))}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="primary-btn">
              {editingStop ? 'Save stop' : 'Add stop'}
            </button>
            <button type="button" className="ghost-btn" onClick={resetForm}>
              {editingStop ? 'Cancel edit' : 'Clear form'}
            </button>
          </div>
        </form>
      </section>

      <section className="stops-list-section">
        <h2>Stops on {selectedDateLabel}</h2>
        {selectedDateStops.length === 0 ? (
          <p className="empty-state">No stops yet. Add your first one using the form.</p>
        ) : (
          <ul className="stops-list">
            {selectedDateStops.map((stop, index) => {
              const arrivalMins = timeToMinutes(stop.time)
              const durationMins = parseDuration(stop.stayDuration || '0')
              const departureMins = arrivalMins + durationMins
              const departureTime = minutesToTime(departureMins)
              const stopNumber = index + 1
              const stopPhotoInputId = `stop-photo-${stop.id}`

              return (
                <li
                  key={stop.id}
                  className={`stop-card ${editingStop?.dateKey === selectedDateKey && editingStop?.stopId === stop.id ? 'active' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => startEditingStop(selectedDateKey, stop.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      startEditingStop(selectedDateKey, stop.id)
                    }
                  }}
                >
                  <div className="stop-header">
                    <h3>Stop {stopNumber}</h3>
                    <div className="stop-details">
                      <span className="stop-name">{stop.name}</span>
                      <span className="stop-time">
                        {formatTimeWithAmPm(stop.time)}
                        {stop.stayDuration && ` → ${formatTimeWithAmPm(departureTime)}`}
                      </span>
                    </div>
                  </div>

                  <p className="stop-click-hint">Click to edit this stop.</p>

                  <p>
                    <strong>Distance:</strong> {stop.distance || 'Not set'}
                  </p>
                  <p>
                    <strong>Stay duration:</strong> {stop.stayDuration || 'Not set'}
                  </p>
                  <p>
                    <strong>Notes:</strong> {stop.interestingInfo || 'No notes yet'}
                  </p>

                  {stop.photos.length > 0 && (
                    <div className="stop-photos">
                      {stop.photos.map((photo, index) => (
                        <img key={`${photo.name}-${index}`} src={photo.previewUrl} alt={photo.name} />
                      ))}
                    </div>
                  )}

                  <label className="inline-photo-upload" htmlFor={stopPhotoInputId} onClick={(event) => event.stopPropagation()}>
                    Add photos
                    <input
                      id={stopPhotoInputId}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => {
                        event.stopPropagation()
                        handleStopPhotoUpload(selectedDateKey, stop.id, event)
                      }}
                    />
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}
