# Neuron AI Assistant — Design

## Summary

Replace the floating "Ask Figgy" chat widget with "Neuron", an inline AI assistant panel embedded as a tab in the existing RightInspector sidebar.

## Changes

### Rename & Reposition
- `ChatbotPanel` → `NeuronPanel`
- Assistant name: "Figgy" → "Neuron"
- Remove fixed-positioned floating button from bottom-right
- Render NeuronPanel inline inside RightInspector (not `fixed`)

### Tab Integration
- RightInspector gains a 4th tab: **Neuron** (alongside Props, Metrics, Model)
- Uses existing dark tab bar style (`#1c1c1e`, `#3ecfcf` cyan accent)

### Neuron Panel UI
- **Empty state:** brain icon + "Neuron" title + subtitle + 4 suggested prompt chips
- **Messages:** dark background, user messages right-aligned cyan, assistant left-aligned dark card, markdown rendered
- **Schema proposal banner:** green banner above input when proposal exists
- **Input:** dark styled input pinned to bottom, placeholder "Ask Neuron..."

### Multi-Provider Backend
- `PROVIDER=openai|anthropic|google` in `.env`
- API keys: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`
- Backend reads `PROVIDER` at startup and routes accordingly
- `.env.example` added with all three providers documented

## Files Affected

- `frontend/src/components/ChatbotPanel.tsx` → renamed/rewritten as `NeuronPanel.tsx`
- `frontend/src/components/RightInspector.tsx` — add Neuron tab
- `frontend/src/routes/Playground.tsx` — remove floating panel, pass chat props to RightInspector
- `backend/controllers/chat_controller.py` — multi-provider routing
- `backend/.env.example` — new file
