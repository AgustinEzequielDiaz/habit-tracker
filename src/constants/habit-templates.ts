import { CreateHabitForm } from '@/types'

export interface HabitTemplate {
  id: string
  name: string
  description: string
  icon: string
  form: Omit<CreateHabitForm, 'color'>
}

export interface TemplateCategory {
  id: string
  label: string
  emoji: string
  color: string
  templates: HabitTemplate[]
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'fitness',
    label: 'Fitness',
    emoji: '💪',
    color: '#EF4444',
    templates: [
      {
        id: 'ejercicio_diario',
        name: 'Ejercicio diario',
        description: '30 minutos de actividad física',
        icon: 'fitness',
        form: { name: 'Ejercicio diario', description: '30 minutos de actividad física', category: 'fitness', type: 'binary', difficulty: 'normal', icon: 'fitness' },
      },
      {
        id: 'agua',
        name: 'Tomar agua',
        description: 'Beber 2L de agua durante el día',
        icon: 'water',
        form: { name: 'Tomar agua', description: 'Beber 2L de agua durante el día', category: 'fitness', type: 'binary', difficulty: 'easy', icon: 'water' },
      },
      {
        id: 'correr',
        name: 'Salir a correr',
        description: 'Una vuelta por el parque o 20+ minutos',
        icon: 'run',
        form: { name: 'Salir a correr', description: 'Una vuelta por el parque o 20+ minutos', category: 'fitness', type: 'binary', difficulty: 'hard', icon: 'run' },
      },
      {
        id: 'dormir_bien',
        name: 'Dormir 8 horas',
        description: 'Respetar el horario de sueño',
        icon: 'sleep',
        form: { name: 'Dormir 8 horas', description: 'Respetar el horario de sueño', category: 'fitness', type: 'binary', difficulty: 'normal', icon: 'sleep' },
      },
    ],
  },
  {
    id: 'productividad',
    label: 'Productividad',
    emoji: '🎯',
    color: '#6366F1',
    templates: [
      {
        id: 'leer',
        name: 'Leer 20 páginas',
        description: 'Lectura diaria de cualquier libro',
        icon: 'book',
        form: { name: 'Leer 20 páginas', description: 'Lectura diaria de cualquier libro', category: 'productividad', type: 'binary', difficulty: 'normal', icon: 'book' },
      },
      {
        id: 'no_redes',
        name: 'Sin redes sociales',
        description: 'No abrir redes antes del mediodía',
        icon: 'star',
        form: { name: 'Sin redes antes del mediodía', description: 'No abrir redes sociales antes del mediodía', category: 'productividad', type: 'binary', difficulty: 'hard', icon: 'star' },
      },
      {
        id: 'estudiar',
        name: 'Estudiar / Aprender',
        description: 'Dedicar 30 min a aprender algo nuevo',
        icon: 'brain',
        form: { name: 'Estudiar 30 minutos', description: 'Dedicar tiempo a aprender algo nuevo', category: 'productividad', type: 'binary', difficulty: 'normal', icon: 'brain' },
      },
      {
        id: 'planificar',
        name: 'Planificar el día',
        description: 'Escribir las 3 prioridades del día',
        icon: 'code',
        form: { name: 'Planificar el día', description: 'Escribir las 3 prioridades del día al despertar', category: 'productividad', type: 'binary', difficulty: 'easy', icon: 'code' },
      },
    ],
  },
  {
    id: 'bienestar',
    label: 'Bienestar',
    emoji: '🧘',
    color: '#10B981',
    templates: [
      {
        id: 'meditacion',
        name: 'Meditar 10 minutos',
        description: 'Sesión diaria de mindfulness',
        icon: 'meditation',
        form: { name: 'Meditar 10 minutos', description: 'Sesión diaria de mindfulness o respiración', category: 'bienestar', type: 'binary', difficulty: 'easy', icon: 'meditation' },
      },
      {
        id: 'gratitud',
        name: 'Diario de gratitud',
        description: 'Escribir 3 cosas por las que estás agradecido',
        icon: 'heart',
        form: { name: 'Diario de gratitud', description: 'Escribir 3 cosas por las que estás agradecido', category: 'bienestar', type: 'binary', difficulty: 'easy', icon: 'heart' },
      },
      {
        id: 'sin_alcohol',
        name: 'Sin alcohol',
        description: 'Un día más sin tomar alcohol',
        icon: 'star',
        form: { name: 'Sin alcohol', description: 'Un día más sin tomar alcohol', category: 'bienestar', type: 'binary', difficulty: 'normal', icon: 'star' },
      },
      {
        id: 'comida_sana',
        name: 'Comer bien',
        description: 'Evitar comida ultra-procesada',
        icon: 'food',
        form: { name: 'Comer bien', description: 'Evitar comida ultra-procesada durante el día', category: 'bienestar', type: 'binary', difficulty: 'normal', icon: 'food' },
      },
    ],
  },
  {
    id: 'rutinas',
    label: 'Rutinas',
    emoji: '⚡',
    color: '#F59E0B',
    templates: [
      {
        id: 'madrugar',
        name: 'Levantarse temprano',
        description: 'Despertar antes de las 7am',
        icon: 'star',
        form: { name: 'Levantarse temprano', description: 'Despertar antes de las 7am', category: 'rutinas', type: 'binary', difficulty: 'hard', icon: 'star' },
      },
      {
        id: 'sin_telefono',
        name: 'Sin teléfono al despertar',
        description: 'No mirar el celular durante la primera hora',
        icon: 'star',
        form: { name: 'Sin teléfono al despertar', description: 'No mirar el celular durante la primera hora del día', category: 'rutinas', type: 'binary', difficulty: 'normal', icon: 'star' },
      },
      {
        id: 'musica_practica',
        name: 'Practicar instrumento',
        description: '15 minutos de práctica musical',
        icon: 'music',
        form: { name: 'Practicar instrumento', description: '15 minutos de práctica musical', category: 'rutinas', type: 'binary', difficulty: 'normal', icon: 'music' },
      },
      {
        id: 'orden',
        name: 'Ordenar el espacio',
        description: 'Dejar el escritorio o cuarto ordenado',
        icon: 'star',
        form: { name: 'Ordenar el espacio', description: 'Dejar el escritorio o cuarto ordenado al finalizar el día', category: 'rutinas', type: 'binary', difficulty: 'easy', icon: 'star' },
      },
    ],
  },
]
