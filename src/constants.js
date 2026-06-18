// ============================================================
//  Constantes del negocio de Universum VR
// ============================================================

export const COMISION = 0.10 // 10% sobre el monto cerrado

export const ESTADOS = [
  'Nuevo', 'Contactado', 'Cotizado', 'Seguimiento', 'Recontactado', 'Cerrado', 'Perdido',
]

export const PAQUETES = ['Gaming', 'Double Gaming', 'Full VR']

// Duración en horas por paquete (para el calendario)
export const DURACION = { 'Gaming': 1, 'Double Gaming': 2, 'Full VR': 3 }

// Tabla de precios: PRECIOS[paquete][personas]
export const PRECIOS = {
  'Gaming':        { 5: 119, 10: 199, 15: 299, 20: 399 },
  'Double Gaming': { 5: 199, 10: 319, 15: 479, 20: 639 },
  'Full VR':       { 5: 249, 10: 449, 15: 649, 20: 949 },
}

export const PERSONAS = [5, 10, 15, 20]

// Experiencias premium (solo aplican al paquete Full VR)
export const PREMIUM = [
  'Titanic: Ecos del Pasado',
  'Coliseo: El Mítico Escenario',
  'Blue Moon: Mission Artemis I',
  'Paraíso Salvaje',
]
