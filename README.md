# Once Told

Once Told is a collaborative storytelling platform built by Ajayi and Maxwell aimed at preserving endangered languages through oral history recording and AI transcription.

## Features

- Record and upload oral stories easily  
- Transcribe audio to text using Google's Gemini transcription API  
- Secure user authentication with JWT  
- Store audio files and transcripts in PostgreSQL  
- Clean, intuitive Vue.js frontend

## Routes
- post - /api/login;
- post - /api/register;
- get - /uploads/[audioname].mp3
- post - /api/stories
- get - /api/stories
- get - /api/stories/story
- post -/api/stories/translate
- post - /api/stories/transcribe


## Getting Started

### Prerequisites for client
- [Click me](https://github.com/Maxxiejay/once-told) to find the Client App
  
### Prerequisites for Server

- Node.js >= 16  
- PostgreSQL  
- Google Gemini API key (see [AI Studio](https://aistudio.google.com))  

### Setup

1. Clone the repo  
2. Configure `.env` with database and API keys  
3. Run Prisma migrations:
