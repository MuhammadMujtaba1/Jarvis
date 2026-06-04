# JARVIS: Autonomous Chrome-Native Agent Matrix

> A real-time conversational AI partner that breaks down goals into multi-tier hierarchical execution graphs and operates continuously in the browser.

## 🚀 Vision

JARVIS is a **lifetime partner** AI system running natively on Chromebooks with zero Linux dependencies. It combines:

- **Real-time Conversational Interface**: Voice-enabled dashboard with audible responses
- **Multi-tier Agent Orchestration**: Hierarchical execution (Tier 1: Director → Tier 4: Quality Gatekeepers)
- **Sleep-Mode Async Execution**: Background task queues continue executing even with the tab minimized
- **Persistent Memory**: IndexedDB-backed semantic memory across sessions
- **DAG-based Task Planning**: Complex goals broken into dependency graphs

## 📐 Architecture

### Tier 1: The Director
- **Orchestrator Agent**: Conversational partner, goal parsing, execution graph creation

### Tier 2: The Managers
- **Product & Design Manager**: Layout blueprints, UI/UX asset mapping
- **Engineering Manager**: Technical workflow translation, dependency management

### Tier 3: The Workers
- **Builder (EVA Coder)**: Clean, modular React/TypeScript code generation
- **Researcher**: Data fetching, API coordination, documentation scanning

### Tier 4: The Quality Gatekeepers
- **Critic**: QA testing, code validation, recursive error routing

## 🏗️ Project Structure

```
src/
├── components/          # React UI components
│   ├── Dashboard.tsx    # Main futuristic interface
│   ├── VoiceControl.tsx # Voice I/O integration
│   └── TaskMonitor.tsx  # Real-time task execution display
├── agents/              # Multi-tier agent system
│   ├── Orchestrator.ts  # Tier 1: Director
│   ├── DesignManager.ts # Tier 2a: Product & Design
│   ├── EngineerManager.ts # Tier 2b: Engineering
│   ├── Builder.ts       # Tier 3a: Code Generator
│   ├── Researcher.ts    # Tier 3b: Data Fetcher
│   └── Critic.ts        # Tier 4: QA Tester
├── utils/               # Utility functions
│   ├── groqClient.ts    # Groq API wrapper
│   ├── indexedDB.ts     # IndexedDB persistence
│   ├── dagProcessor.ts  # DAG execution engine
│   └── messageQueue.ts  # Message passing system
├── workers/             # Web Workers
│   ├── taskWorker.ts    # Background task execution
│   └── syncWorker.ts    # Background sync handler
├── hooks/               # React hooks
│   ├── useAgentMemory.ts # Semantic memory access
│   └── useTaskQueue.ts  # Task queue management
├── styles/              # Tailwind + custom CSS
│   └── globals.css
├── types/               # TypeScript type definitions
│   └── index.ts
├── App.tsx              # Root component
└── main.tsx             # Entry point

public/
├── index.html
└── favicon.ico
```

## 🔧 Setup & Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Groq API Key (free at https://console.groq.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/MuhammadMujtaba1/Jarvis.git
cd Jarvis

# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local
# Edit .env.local and add your Groq API key

# Start development server
npm run dev
```

## 🎯 Core Features

### 1. Real-Time Conversational Partnership
- Voice input via microphone
- Natural language goal parsing
- Audible AI responses
- Cross-session memory retention

### 2. Multi-Tier Agent Orchestration
- Director receives goals → Creates execution DAG
- Managers coordinate specialized workers
- Workers execute focused tasks
- Critics validate and loop back errors

### 3. Background Execution
- Web Worker for CPU-intensive tasks
- Service Worker for offline capability
- IndexedDB for persistent state
- Continues executing while tab is minimized

### 4. Semantic Memory System
- User habits and preferences
- Project definitions
- Historical execution logs
- Real-time task status

## 📝 Usage Example

```typescript
// User speaks: "Help me build a todo app with React"

// Orchestrator breaks this into:
{
  goal: "Build todo app with React",
  dag: [
    { id: "design", task: "Create UI mockup", deps: [] },
    { id: "build", task: "Implement components", deps: ["design"] },
    { id: "test", task: "Validate functionality", deps: ["build"] },
    { id: "deploy", task: "Deploy to Vercel", deps: ["test"] }
  ]
}

// Tasks execute asynchronously in workers
// Results stored in IndexedDB
// UI updates in real-time
```

## 🔐 Security

- **API Keys**: Never committed to repo, stored in `.env.local`
- **IndexedDB**: Client-side only, no data sent to servers except via explicit APIs
- **Service Worker**: Handles offline scenarios safely
- **Input Validation**: All user inputs sanitized before processing

## 🚦 Development Roadmap

- [ ] Core agent scaffolding
- [ ] Groq API integration & streaming
- [ ] IndexedDB memory system
- [ ] Web Worker task execution
- [ ] Voice input/output (Web Speech API)
- [ ] DAG task processor
- [ ] React UI dashboard
- [ ] Service Worker for offline
- [ ] Cross-session persistence
- [ ] Advanced error routing & recovery

## 📚 Resources

- [Groq API Docs](https://console.groq.com/docs)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [call-with-ai-agent Integration](https://github.com/aimaster-dev/call-with-ai-agent)

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.
