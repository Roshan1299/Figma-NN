# Figma NN: Visual Neural Network Builder

Figma NN is a browser-based tool for building, training, and sharing neural networks through a drag-and-drop canvas interface. Built for Hacked 26.

It targets people who understand machine learning conceptually but want to iterate on architectures without writing boilerplate code. Design a network visually, hit train, and get real results, then share it or export the PyTorch code.

---

## Features

### Canvas Builder
- Drag layers from the sidebar onto a live canvas powered by React Flow
- Connect layers by drawing edges between them
- Real-time tensor shape inference displayed on every edge (e.g. `32 x 13 x 13`)
- Connection validation prevents architecturally invalid links
- Undo / Redo, Copy / Paste, alignment guides, snap-to-grid

### Layer Types
| Layer | Key Parameters |
|---|---|
| Input | Dataset (MNIST / EMNIST) |
| Dense | Units, activation |
| Convolution | Filters, kernel, stride, padding, activation |
| Pooling | Pool size, stride, padding |
| Flatten | - |
| Batch Normalization | - |
| Dropout | Rate |
| Residual Block | Filters, kernel (with skip connection) |
| Output | Classes, softmax |

### Training
- Configurable hyperparameters: epochs, batch size, optimizer (SGD / Adam), learning rate, momentum, train split, seed
- Real-time loss and accuracy charts streamed via Server-Sent Events
- Cancel mid-run
- 8 sample predictions shown after training completes
- Supports MNIST (digits 0-9) and EMNIST (letters A-Z)

### Architecture Presets
Six built-in starting points across two rows:

| Preset | Architecture |
|---|---|
| Empty | Input -> Flatten -> Output |
| Linear | Input -> Flatten -> Dense -> Output |
| Deep CNN | Conv -> BN -> Pool -> Conv -> BN -> Pool -> Dense -> Dropout -> Output |
| Deep MLP | Input -> Flatten -> Dense(256) -> BN -> Dropout -> Dense(128) -> BN -> Dropout -> Output |
| LeNet | Conv(6) -> Pool -> Conv(16) -> Pool -> Dense(120) -> Dense(84) -> Output |
| ResNet Lite | Conv -> BN -> Pool -> ResBlock -> ResBlock -> Dense -> Dropout -> Output |

### Test Page
- 28x28 drawing canvas: draw a digit or letter with your mouse
- Select any trained model and run inference
- Predicted class and confidence displayed immediately

### Version History
- Git-style manual commits: name a snapshot and save it
- Timeline view with mini architecture previews per version
- Two-step restore (confirm before overwriting canvas)
- Undo stack preserved; Ctrl+Z works after a restore
- Persisted to `localStorage`, survives page refresh
- Ctrl+S opens the History tab directly

### AI Assistant: Neuron
- Chat interface in the right inspector panel
- Can propose architecture changes in response to plain-English requests
- Side-by-side diff view (current vs proposed) with color-coded changes before applying
- Supports OpenAI, Anthropic Claude, and Google Gemini as backends (configurable)

### Marketplace
- Publish any canvas as a community model with a name, description, tags, and screenshot
- Browse all published models in a card grid
- Import any marketplace model directly into the canvas
- Architecture and import state persist across page refresh

### Real-Time Collaboration
- All users on the same server share one live canvas
- Every operation (add layer, move, connect, delete, load preset) is broadcast instantly via Socket.IO
- Live cursors with colored labels for each connected user
- Identicon avatars in the header presence strip

### Code Export
- Auto-generated PyTorch code from the current canvas
- Syntax highlighted in the Code tab
- Download as `model.py` or copy to clipboard

---

## Tech Stack

**Frontend**
- React 18 + TypeScript + Vite
- React Flow (`@xyflow/react`): canvas and node graph
- Zustand: state management (with `persist` middleware for localStorage)
- TailwindCSS: styling
- Recharts: training metric charts
- Socket.IO client: real-time collaboration
- React Query: data fetching

**Backend**
- Flask: HTTP API
- Flask-SocketIO: WebSocket collaboration
- PyTorch + torchvision: model building and training
- SQLite: marketplace model storage

---

## Project Structure

```
Figma-NN/
├── backend/
│   ├── api.py                        # Flask app entry point, training endpoints
│   ├── collab.py                     # Socket.IO handlers, shared canvas state
│   ├── store.py                      # Thread-safe in-memory store
│   ├── controllers/
│   │   ├── chat_controller.py        # AI assistant (multi-provider streaming)
│   │   ├── model_controller.py       # Model CRUD
│   │   └── marketplace_controller.py # Marketplace CRUD + SQLite
│   ├── services/
│   │   └── model_service.py          # PyTorch model building + training loop
│   └── utils/
│       └── validation.py             # Architecture + hyperparameter validation
└── frontend/
    └── src/
        ├── routes/                   # Page components (Playground, Test, Marketplace, Models)
        ├── components/               # UI components (nodes, sidebar, inspector, drawers)
        ├── store/                    # Zustand stores (graph, collab, training, versions, marketplace)
        ├── hooks/                    # useChat, useTraining, useCollaboration
        ├── lib/                      # codeGenerator, architectureParser, shapeInference
        └── types/                    # TypeScript types (graph, layers)
```

---

## Setup

See [Setup.md](./Setup.md) for full installation and configuration instructions.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/train` | Start a training run |
| POST | `/api/train/:run_id/cancel` | Cancel an active run |
| GET | `/api/runs/:run_id/events` | SSE stream for real-time metrics |
| POST | `/api/infer` | Run inference on pixel input |
| POST | `/api/models/save` | Save a trained model |
| GET | `/api/models` | List saved models |
| GET | `/api/models/:id` | Model detail |
| POST | `/api/chat` | AI assistant (streaming) |
| GET | `/api/marketplace/models` | List marketplace models |
| POST | `/api/marketplace/models` | Publish a model |
| GET | `/api/marketplace/models/:id` | Marketplace model detail |
| WS | `/socket.io` | Real-time collaboration |

---

## Known Limitations

- Training run metadata is held in memory. The backend restarting clears it, though trained weight files on disk are preserved.
- One training run can be active at a time.
- Collaboration uses a single shared canvas room. Separate project rooms are not yet supported.
- The marketplace is anonymous. User accounts are not implemented.
- Canvas state is session-only. Refreshing loads a blank canvas unless arriving via a marketplace import URL.
