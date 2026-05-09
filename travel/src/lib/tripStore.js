import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'

function userTripDoc(db, uid) {
  return doc(db, 'users', uid)
}

export function listenToUserTripData(db, uid, onData) {
  return onSnapshot(userTripDoc(db, uid), (snapshot) => {
    onData(snapshot.exists() ? snapshot.data() : null)
  })
}

export function saveUserTripData(db, uid, tripData) {
  return setDoc(
    userTripDoc(db, uid),
    {
      ...tripData,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}