export const SERVICES = [
  {
    id: "svc-signature-cut",
    name: "Signature Cut",
    basePrice: 45,
    durationMinutes: 45,
  },
  {
    id: "svc-skin-fade",
    name: "Skin Fade",
    basePrice: 55,
    durationMinutes: 50,
  },
  {
    id: "svc-beard-lineup",
    name: "Beard Line-Up",
    basePrice: 35,
    durationMinutes: 30,
  },
  {
    id: "svc-cut-shave",
    name: "Cut + Hot Towel Shave",
    basePrice: 75,
    durationMinutes: 75,
  },
];

export const BARBERS = [
  { id: "barber-arif", displayName: "Arif" },
  { id: "barber-haziq", displayName: "Haziq" },
  { id: "barber-iman", displayName: "Iman" },
];

const SLOT_TEMPLATES = [
  { start: "10:00", end: "10:45" },
  { start: "11:00", end: "11:45" },
  { start: "12:00", end: "12:45" },
  { start: "14:00", end: "14:45" },
  { start: "15:00", end: "15:45" },
  { start: "16:00", end: "16:45" },
];

export const getDummySlots = (dateId: string) =>
  SLOT_TEMPLATES.map((slot) => ({
    startAt: `${dateId}T${slot.start}:00+08:00`,
    endAt: `${dateId}T${slot.end}:00+08:00`,
  }));
