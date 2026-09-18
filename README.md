# Precise Notes


**Precise Notes** is an intelligent, privacy-focused lecture synthesizer that transforms long-form video lectures into structured, easy-to-read Markdown notes using generative AI.

Instead of uploading large video files to a backend server, Precise Notes processes video **locally in your browser** using FFmpeg WebAssembly, extracts the audio, and sends only the required audio chunks to Google's Gemini model for transcription and synthesis.

> Turn hours of lectures into structured notes in minutes.

---

## ✨ Features

- 🔒 **Local Video Processing** — Video files are processed directly in your browser and are never uploaded to your server.
- ⚡ **FFmpeg WebAssembly** — Extract and process audio directly on the user's device.
- 🤖 **AI-Powered Notes** — Uses Gemini to transform lecture content into structured, comprehensive notes.
- 📝 **Markdown Output** — Notes are generated in clean, structured Markdown.
- 💅 **Notion-Style Editor** — Clean workspace designed for reading and organizing notes.
- 📋 **One-Click Copy** — Copy generated notes directly to your clipboard.
- 📥 **Markdown Export** — Download your notes as a `.md` file.
- 🌙 **Dark Mode** — Comfortable interface for extended study sessions.
- 🚀 **Serverless Architecture** — AI requests are handled through Next.js API routes without maintaining a traditional backend server.

---

## 🧠 How It Works

Traditional lecture transcription applications usually require uploading the entire video to a remote server.

For large lectures, this can mean uploading several gigabytes of data before processing can even begin.

Precise Notes takes a different approach:

```text
                    Local Browser
                         │
                         ▼
                 ┌───────────────┐
                 │   Video File  │
                 └───────┬───────┘
                         │
                         ▼
                ┌─────────────────┐
                │  FFmpeg WASM    │
                │ Audio Extraction│
                └────────┬────────┘
                         │
                         ▼
                 Audio Chunks
                         │
                         ▼
              ┌────────────────────┐
              │ Next.js API Route  │
              └──────────┬─────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  Gemini 2.5     │
                │      Flash      │
                └────────┬────────┘
                         │
                         ▼
                 Structured Markdown
                         │
                         ▼
                  Precise Notes UI
```

### Local Video Processing

When a user selects a video, FFmpeg runs inside the browser through WebAssembly.

The application extracts the audio locally instead of uploading the original video file.

### Audio Processing

The extracted audio is divided into manageable chunks before being sent for AI processing.

### AI Synthesis

The audio chunks are processed through Google's Gemini 2.5 Flash model.

Gemini understands the lecture content and produces structured notes containing headings, explanations, lists, code examples, and other relevant information.

### Final Output

The generated Markdown is rendered inside the application and can be:

- Read directly in the application
- Copied to the clipboard
- Downloaded as a Markdown file
- Imported into applications such as Notion or Obsidian

---

## 🏗️ Architecture

Precise Notes uses a lightweight serverless architecture:

```text
┌─────────────────────────────────────────────┐
│                  Browser                    │
│                                             │
│  ┌────────────┐      ┌──────────────────┐   │
│  │ Video File │ ───► │   FFmpeg WASM    │   │
│  └────────────┘      └────────┬─────────┘   │
│                               │             │
│                         Audio Chunks        │
└───────────────────────────────┼─────────────┘
                                │
                                ▼
                     ┌────────────────────┐
                     │ Next.js API Route  │
                     └──────────┬─────────┘
                                │
                                ▼
                     ┌────────────────────┐
                     │   Gemini 2.5 Flash │
                     └──────────┬─────────┘
                                │
                                ▼
                     Structured Markdown
```

### Why this architecture?

The architecture minimizes unnecessary data transfer.

The original video file remains on the user's device, eliminating the need to upload potentially large lecture recordings to an application server.

Only the extracted audio data required for AI processing is transmitted.

---

## 💻 Tech Stack

### Frontend

- **Next.js 15**
- **React**
- **TypeScript**
- **Tailwind CSS v4**
- **Lucide React**
- **Tailwind Typography**

### Local Processing

- **FFmpeg.wasm**
- **WebAssembly**
- **SharedArrayBuffer**

### AI

- **Google Generative AI**
- **Gemini 2.5 Flash**

### Deployment

- **Vercel**
- Next.js Serverless API Routes

---

## 📁 Project Structure

```text
precise-notes/
│
├── app/
│   ├── api/
│   │   └── ...
│   ├── components/
│   │   └── ...
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── public/
│   └── ...
│
├── lib/
│   └── ...
│
├── next.config.mjs
├── package.json
├── tsconfig.json
├── postcss.config.mjs
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have:

- Node.js 18 or later
- npm
- A Google AI Studio API key

### 1. Clone the Repository

```bash
git clone https://github.com/princelohiya/precise-notes.git
cd precise-notes
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

Never commit `.env.local` or expose your API key publicly.

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

## ⚠️ SharedArrayBuffer Configuration

FFmpeg WebAssembly relies on `SharedArrayBuffer` for efficient processing.

Modern browsers require cross-origin isolation to enable it.

Precise Notes therefore uses the following security headers:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

These headers are configured in `next.config.mjs`.

If you modify the Next.js configuration, make sure these headers remain enabled.

Without them, FFmpeg WebAssembly may fail to initialize correctly.

---

## 🔐 Privacy

Privacy is one of the core design principles of Precise Notes.

### What stays on your device?

The original video file is processed locally in the browser.

```text
Video File
    │
    ▼
Your Browser
    │
    ▼
FFmpeg WASM
```

The original video is **not uploaded to the Precise Notes server**.

### What is sent to the AI?

The application extracts audio from the video and sends the required audio data to Gemini for AI processing.

Therefore:

> **Your video stays local, but extracted audio is transmitted to Google's Gemini API for processing.**

Do not process sensitive or confidential lectures unless you are comfortable with the applicable AI provider's data-processing policies.

---

## 🎓 Use Cases

Precise Notes is particularly useful for:

- University lectures
- Programming tutorials
- Technical courses
- Conference talks
- Long-form presentations
- Exam preparation
- Self-paced learning

For example:

```text
2-hour Programming Lecture
            │
            ▼
       Precise Notes
            │
            ▼
┌───────────────────────────┐
│ 1. Introduction            │
│ 2. Core Concepts           │
│ 3. Architecture            │
│ 4. Code Examples           │
│ 5. Important Details       │
│ 6. Summary                 │
└───────────────────────────┘
```

---

## 📋 Output Format

Precise Notes generates structured Markdown instead of returning a raw transcript.

Example:

```markdown
# REST API Architecture

## What is a REST API?

A REST API is an architectural style for building
web services that communicate using HTTP.

## Core Principles

### 1. Client-Server Architecture

The client and server are separated...

### 2. Statelessness

Each request contains all information required
to process that request...

## Example

GET /users/123

The server responds with the requested user...
```

This makes the output suitable for:

- Notion
- Obsidian
- VS Code
- GitHub
- Markdown editors
- Personal knowledge bases

---

## ⚡ Performance Considerations

Processing large videos entirely inside a browser can be memory-intensive.

Performance depends on:

- Video size
- Video duration
- Audio bitrate
- Available RAM
- Browser implementation
- CPU performance
- FFmpeg processing time
- Internet connection speed

For particularly large files, keeping other memory-intensive applications closed can improve performance.

---

## 🛠️ Development

Run the development server:

```bash
npm run dev
```

Build the application:

```bash
npm run build
```

Run the production server:

```bash
npm start
```

Run linting:

```bash
npm run lint
```

---

## ☁️ Deployment

Precise Notes can be deployed using Vercel.

The main deployment requirements are:

1. Import the GitHub repository into Vercel.
2. Add the `GEMINI_API_KEY` environment variable.
3. Deploy the application.
4. Ensure the cross-origin isolation headers remain configured.

The application does not require a traditional database or dedicated backend server.

---

## 🔮 Future Improvements

Potential improvements include:

- [ ] Speaker identification
- [ ] Automatic chapter detection
- [ ] Timestamped notes
- [ ] Multiple AI model providers
- [ ] PDF export
- [ ] Direct Notion integration
- [ ] Quiz generation
- [ ] Flashcard generation
- [ ] Lecture summaries
- [ ] Search across previous lectures
- [ ] User accounts and cloud note synchronization
- [ ] Background processing for extremely large lectures

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

To contribute:

```bash
git clone https://github.com/princelohiya/precise-notes.git
cd precise-notes
npm install
npm run dev
```

Create a feature branch, make your changes, and open a pull request.

---

## 📄 License

This project is licensed under the **MIT License**.

See the `LICENSE` file for more information.

---

## ⭐ Support

If you find Precise Notes useful, consider giving the repository a ⭐ on GitHub.

**Precise Notes — Turn lectures into knowledge.**
