import type { Session, Options } from '../types'

export function setHasOverlap<T>(setA: Set<T>, setB: Set<T>): boolean {
  for (const val of Array.from(setA)) {
    if (setB.has(val)) return true
  }
  return false
}

export function selectData(sessions: Array<Session>, options?: Options): Array<Session> {
  const reversedSessions = sessions.slice().reverse()
  const sessionsForUser = new Map<
    number,
    { user: number; duration: number; equipment: Set<string> }
  >()
  const sessionsProcessed: Array<{
    user: number
    duration: number
    equipment: Set<string>
  }> = []

  reversedSessions.forEach(session => {
    if (options?.merge && sessionsForUser.has(session.user)) {
      const userSession = sessionsForUser.get(session.user)!
      userSession.duration += session.duration
      session.equipment.forEach(e => userSession.equipment.add(e))
    } else {
      const clonedSession = { ...session, equipment: new Set(session.equipment) }
      if (options?.merge) sessionsForUser.set(session.user, clonedSession)
      sessionsProcessed.push(clonedSession)
    }
  })

  sessionsProcessed.reverse()

  const optionEquipments = new Set(options?.equipment)
  const results: Array<Session> = []

  sessionsProcessed.forEach(session => {
    if (
      (options?.user != null && options.user !== session.user) ||
      (optionEquipments.size > 0 && !setHasOverlap(optionEquipments, session.equipment)) ||
      (options?.minDuration != null && options.minDuration > session.duration)
    ) {
      return
    }
    results.push({ ...session, equipment: Array.from(session.equipment).sort() })
  })

  return results
}

export function mergeData(sessions: Array<Session>): Array<Session> {
  // Map сохраняет порядок первой вставки — Map.values() даёт нужный порядок без отдельного results
  const sessionsForUser = new Map<
    number,
    { user: number; duration: number; equipment: Set<string> }
  >()

  sessions.forEach(session => {
    if (sessionsForUser.has(session.user)) {
      const userSession = sessionsForUser.get(session.user)!
      userSession.duration += session.duration
      session.equipment.forEach(eq => userSession.equipment.add(eq))
    } else {
      sessionsForUser.set(session.user, {
        ...session,
        equipment: new Set(session.equipment),
      })
    }
  })

  return Array.from(sessionsForUser.values()).map(session => ({
    ...session,
    equipment: Array.from(session.equipment).sort(),
  }))
}
