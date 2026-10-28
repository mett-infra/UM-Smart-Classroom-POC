/*
  Face database for the proof of concept: only the demo participant below.
  The photo and face template are NOT part of this file or the website: they are captured on the demo device
  and kept in that browser only (see src/store/faces.ts).
*/

export interface FacePerson {
  id: string
  name: string
  designation: string
  organisation: string
  email: string
  idNo: string
  color: string
}

export const facePeople: FacePerson[] = [{ id: 'fp-pranav', name: 'Pranav Kuri', designation: 'CTO', organisation: 'Metgabb Sdn Bhd', email: 'mark.k@metgabb.com', idNo: 'DEMO-0001', color: '#2f55d4' }]

export const facePersonById = (id: string) => facePeople.find((p) => p.id === id)
