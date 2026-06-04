export type Session = { user: number; duration: number; equipment: Array<string> }
export type Options = {
  user?: number
  minDuration?: number
  equipment?: Array<string>
  merge?: boolean
}
