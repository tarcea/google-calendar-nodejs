const express = require('express');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();

let auth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECTT_URL
);

const calendar = google.calendar({
  version: 'v3',
  auth: process.env.API_KEY,
});

const scopes = ['https://www.googleapis.com/auth/calendar'];

app.get('/google', (req, res) => {
  try {
    const url = auth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
    res.redirect(url);
  } catch (err) {
    console.error('/google', err);
    return;
  }
});

app.get('/google/redirect', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await auth2Client.getToken(code);
    await auth2Client.setCredentials(tokens);
    console.log(tokens.refresh_token);
    res.json({ message: 'successfull!!!' });
  } catch (err) {
    console.error('/google/redirect', err);
    return;
  }
});

app.get('/schedule', async (req, res) => {
  try {
    const eventStartTime = new Date();
    eventStartTime.setDate(eventStartTime.getDate() + 2);

    const eventEndTime = new Date();
    eventEndTime.setDate(eventStartTime.getDate() + 2);
    eventEndTime.setMinutes(eventStartTime.getMinutes() + 45);

    calendar.events.insert({
      auth: auth2Client,
      calendarId: 'primary',
      requestBody: {
        summary: 'Your booking',
        location: 'Slottsbacken 11130 Slottsbacken 8',
        start: {
          dateTime: eventStartTime.toISOString(),
          timeZone: 'Europe/Stockholm',
        },
        end: {
          dateTime: eventEndTime.toISOString(),
          timeZone: 'Europe/Stockholm',
        },
      },
    });
    res.json({ message: 'inserted successfully!!!' });
  } catch (err) {
    console.error('/schedule', err);
    return;
  }
});

app.get('/events', async (req, res) => {
  try {
    const response = await calendar.events.list({
      auth: auth2Client,
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });
    const events = response.data.items;
    if (!events || events.length === 0) {
      res.json({ message: 'No upcoming events found.' });
      return;
    }
    return res.json({ events });
  } catch (err) {
    console.error('/events', err);
    return;
  }
});

app.listen(3001, () => console.log(`App listening on port 3001!`));
