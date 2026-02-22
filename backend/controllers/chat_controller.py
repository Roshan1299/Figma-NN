from flask import Blueprint, request, Response, stream_with_context
from utils.response import error_response
import os
import json
import re
import traceback
import logging

chat_bp = Blueprint("chat", __name__)

logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Neuron, a helpful AI assistant for a neural network architecture builder supporting both MNIST and EMNIST.
Answer user questions conversationally and helpfully.

About the app:
FigmaNN is a no-code tool for building, running, and testing neural networks. Users drag and drop layer types onto a canvas, connect them, configure hyperparameters, train on MNIST (digits 0-9) or EMNIST (letters A-Z), and test their models in real time by drawing inputs.

Supported layers: Input, Convolution, Pooling, Flatten, Dense, Dropout, Output.

IMPORTANT: Only propose architecture changes when the user EXPLICITLY asks you to modify, improve, add, remove, or change their neural network architecture.

Examples of when to propose changes:
- "add a dropout layer"
- "improve this model"
- "make it deeper"
- "change the architecture"
- "remove the second dense layer"

Examples of when NOT to propose changes (answer conversationally):
- "what does this model do?"
- "explain this architecture"
- "what is a convolutional layer?"
- "tell me about neural networks"

When you DO propose changes:
1. Provide a clear, conversational explanation of WHAT you're changing and WHY
2. After your explanation, write exactly this sentence on its own line: "Certainly! Here is your current architecture schema, re-implemented as requested:"
3. Immediately after that sentence, include the complete JSON schema wrapped in a ```json code block

Schema format:
{
  "layers": {
    "layer-id": {
      "id": "layer-id",
      "kind": "Input" | "Convolution" | "Pooling" | "Flatten" | "Dense" | "Dropout" | "Output",
      "params": { ... },
      "position": { "x": number, "y": number }
    }
  },
  "edges": [
    { "id": "edge-id", "source": "source-layer-id", "target": "target-layer-id" }
  ]
}

Layer params:
- Input: { "size": number, "channels": 1, "height": 28, "width": 28 }
- Convolution: { "filters": number, "kernel": number, "stride": number, "padding": "same" | "valid", "activation": "relu" | "sigmoid" | "tanh" }
- Pooling: { "type": "max", "pool_size": number, "stride": number, "padding": number }
- Flatten: { }
- Dense: { "units": number, "activation": "relu" | "sigmoid" | "tanh" | "none" }
- Dropout: { "rate": number }
- Output: { "classes": number, "activation": "softmax" }

Only use these layer types and params. Position layers horizontally (x: 0, 300, 600, etc., y: 200).
"""


def _get_provider():
    """Return (provider_name, api_key) or raise ValueError."""
    provider = os.environ.get("PROVIDER", "openai").lower().strip()
    if provider == "openai":
        key = os.environ.get("OPENAI_API_KEY")
        if not key:
            raise ValueError("OPENAI_API_KEY not set")
        return "openai", key
    elif provider == "anthropic":
        key = os.environ.get("ANTHROPIC_API_KEY")
        if not key:
            raise ValueError("ANTHROPIC_API_KEY not set")
        return "anthropic", key
    elif provider == "google":
        key = os.environ.get("GOOGLE_API_KEY")
        if not key:
            raise ValueError("GOOGLE_API_KEY not set")
        return "google", key
    else:
        raise ValueError(f"Unknown PROVIDER '{provider}'. Use openai, anthropic, or google.")


def _stream_openai(messages, api_key):
    from openai import OpenAI
    client = OpenAI(api_key=api_key)
    stream = client.chat.completions.create(
        model=os.environ.get("OPENAI_MODEL", "gpt-4o"),
        messages=messages,
        stream=True,
        temperature=0.7,
    )
    full_response = ""
    for chunk in stream:
        if chunk.choices[0].delta.content:
            token = chunk.choices[0].delta.content
            full_response += token
            yield token
    return full_response


def _stream_anthropic(messages, api_key):
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    # Anthropic uses a separate system param; extract it
    system = next((m["content"] for m in messages if m["role"] == "system"), "")
    user_msgs = [m for m in messages if m["role"] != "system"]
    with client.messages.stream(
        model=os.environ.get("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022"),
        max_tokens=4096,
        system=system,
        messages=user_msgs,
    ) as stream:
        for text in stream.text_stream:
            yield text


def _stream_google(messages, api_key):
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name=os.environ.get("GOOGLE_MODEL", "gemini-1.5-flash"),
        system_instruction=next((m["content"] for m in messages if m["role"] == "system"), None),
    )
    user_msgs = [m for m in messages if m["role"] != "system"]
    # Convert to Gemini format
    gemini_msgs = [{"role": "user" if m["role"] == "user" else "model", "parts": [m["content"]]} for m in user_msgs]
    response = model.generate_content(gemini_msgs, stream=True)
    for chunk in response:
        if chunk.text:
            yield chunk.text


@chat_bp.route("/api/chat", methods=["POST"])
def chat_with_assistant():
    if not request.is_json:
        return error_response("Expected JSON payload.", status=415)

    try:
        payload = request.get_json(force=True)
    except Exception:
        return error_response("Malformed JSON payload.")

    if not isinstance(payload, dict):
        return error_response("Payload must be a JSON object.")

    message = payload.get("message")
    current_schema = payload.get("currentSchema")

    if not isinstance(message, str) or not message:
        return error_response("`message` is required.", status=400)

    try:
        provider, api_key = _get_provider()
    except ValueError as e:
        return error_response(str(e), status=500)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if current_schema:
        user_content = f"Current architecture:\n```json\n{json.dumps(current_schema, indent=2)}\n```\n\nUser question: {message}"
    else:
        user_content = message
    messages.append({"role": "user", "content": user_content})

    def event_generator():
        try:
            if provider == "openai":
                streamer = _stream_openai(messages, api_key)
            elif provider == "anthropic":
                streamer = _stream_anthropic(messages, api_key)
            else:
                streamer = _stream_google(messages, api_key)

            full_response = ""
            for token in streamer:
                full_response += token
                yield f"event: token\ndata: {json.dumps({'content': token})}\n\n"

            json_match = re.search(r"```json\s*(\{.*?\})\s*```", full_response, re.DOTALL)
            if json_match:
                try:
                    proposed_schema = json.loads(json_match.group(1))
                    yield f"event: schema\ndata: {json.dumps({'proposedSchema': proposed_schema})}\n\n"
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse proposed schema: {e}")

            yield f"event: done\ndata: {json.dumps({})}\n\n"

        except Exception as exc:
            logger.error(f"Chat error: {exc}")
            logger.error(traceback.format_exc())
            yield f"event: error\ndata: {json.dumps({'error': str(exc)})}\n\n"

    return Response(
        stream_with_context(event_generator()), mimetype="text/event-stream"
    )
