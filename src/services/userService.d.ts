import { AxiosPromise } from 'axios';

// USER DATA (Sem alterações nos parâmetros aqui)
export const getUserData: (id: string | number) => AxiosPromise<any>;
export const changePassword: (id: string | number, passwordData: any) => AxiosPromise<any>;
export const updateUserData: (id: string | number, userData: any) => AxiosPromise<any>;
export const deleteUser: (id: string | number) => AxiosPromise<any>;

// MENTOR AVAILABILITY
export const getMentorAvailability: (mentorId: string | number) => AxiosPromise<any>; // Parâmetro 'userId' alterado para 'mentorId'
export const addMentorAvailability: (mentorId: string | number, availabilityData: any) => AxiosPromise<any>; // Parâmetro 'userId' alterado para 'mentorId'
export const updateAvailabilityStatus: (
  mentorId: string | number, // Parâmetro 'userId' alterado para 'mentorId'
  availabilityId: string | number,
  statusData: any
) => AxiosPromise<any>;
export const deleteAvailability: (mentorId: string | number, availabilityId: string | number) => AxiosPromise<any>; // Parâmetro 'userId' alterado para 'mentorId'

// TUTORING SESSIONS
export const getUserParticipationSessions: (userId: string | number) => AxiosPromise<any>; // Parâmetro 'id' alterado para 'userId'
export const getUserMentoringSessions: (userId: string | number) => AxiosPromise<any>; // Parâmetro 'id' alterado para 'userId'

// Nova função
export const getAvailableTutoringSessions: (
  userId: string | number,
  disciplineId: string | number,
  date: string // Assumindo que a data será passada como string no formato "AAAA-MM-DD"
) => AxiosPromise<any>;

// Nova função
export const scheduleTutoringSession: (scheduleData: any) => AxiosPromise<any>;

export const confirmTutoringSession: (tutoringId: string | number, confirmationData: any) => AxiosPromise<any>; // Parâmetro 'sessionId' alterado para 'tutoringId'

// Nova função
export const joinTutoringSession: (tutoringId: string | number, participantData: any) => AxiosPromise<any>; // participantData: { userId: string | number, topic: string }

export const leaveTutoringSession: (tutoringId: string | number, userId: string | number) => AxiosPromise<any>;
export const cancelMentorTutoringSession: (
  userId: string | number,
  tutoringId: string | number,
  deactivateAvailability?: boolean
) => AxiosPromise<any>;
