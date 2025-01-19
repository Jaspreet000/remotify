import { google } from 'googleapis';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: { email: string }[];
}

export async function getGoogleAuthClient(refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  return oauth2Client;
}

export async function listCalendarEvents(auth: any, timeMin: Date, timeMax: Date) {
  const calendar = google.calendar({ version: 'v3', auth });
  
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items;
}

export async function createCalendarEvent(auth: any, event: CalendarEvent) {
  const calendar = google.calendar({ version: 'v3', auth });
  
  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  return response.data;
}

export async function blockFocusTime(auth: any, startTime: Date, duration: number) {
  const endTime = new Date(startTime.getTime() + duration * 60000);
  
  const event: CalendarEvent = {
    summary: '🎯 Focus Time',
    description: 'Blocked for deep work and focused tasks',
    start: {
      dateTime: startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  return createCalendarEvent(auth, event);
}

export async function findAvailableSlots(auth: any, duration: number, startDate: Date, endDate: Date) {
  const events = await listCalendarEvents(auth, startDate, endDate);
  const workingHourStart = 9; // 9 AM
  const workingHourEnd = 17; // 5 PM
  
  const availableSlots: Date[] = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Skip weekends
      const dayStart = new Date(currentDate.setHours(workingHourStart, 0, 0, 0));
      const dayEnd = new Date(currentDate.setHours(workingHourEnd, 0, 0, 0));
      
      const dayEvents = events.filter(event => {
        const eventStart = new Date(event.start.dateTime);
        return eventStart.getDate() === currentDate.getDate();
      });
      
      let timeSlot = new Date(dayStart);
      while (timeSlot.getTime() + duration * 60000 <= dayEnd.getTime()) {
        const slotEnd = new Date(timeSlot.getTime() + duration * 60000);
        const hasConflict = dayEvents.some(event => {
          const eventStart = new Date(event.start.dateTime);
          const eventEnd = new Date(event.end.dateTime);
          return timeSlot < eventEnd && slotEnd > eventStart;
        });
        
        if (!hasConflict) {
          availableSlots.push(new Date(timeSlot));
        }
        timeSlot = new Date(timeSlot.getTime() + 30 * 60000); // 30-minute increments
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return availableSlots;
} 