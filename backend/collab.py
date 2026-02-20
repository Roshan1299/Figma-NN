import threading
import uuid

from flask import request as flask_request
from flask_socketio import SocketIO, emit, join_room

GLOBAL_ROOM = "global"

COLLAB_COLORS = [
    "#EF4444",  # red
    "#3B82F6",  # blue
    "#10B981",  # emerald
    "#F59E0B",  # amber
    "#8B5CF6",  # violet
    "#EC4899",  # pink
    "#06B6D4",  # cyan
    "#84CC16",  # lime
]

_graph_state = {"layers": {}, "edges": []}
_connected_users = {}   # sid -> user_info
_client_registry = {}   # clientId -> {userId, color, name} — persists across reconnects
_join_counter = 0
_state_lock = threading.Lock()


def _apply_op_to_state(op_type: str, payload: dict):
    """Mutate _graph_state in-place for the given op."""
    if op_type == "add_layer":
        layer = payload.get("layer")
        if layer and "id" in layer:
            _graph_state["layers"][layer["id"]] = layer

    elif op_type == "remove_layer":
        layer_id = payload.get("id")
        if layer_id:
            _graph_state["layers"].pop(layer_id, None)
            _graph_state["edges"] = [
                e for e in _graph_state["edges"]
                if e.get("source") != layer_id and e.get("target") != layer_id
            ]

    elif op_type == "update_layer_params":
        layer_id = payload.get("id")
        params = payload.get("params", {})
        if layer_id and layer_id in _graph_state["layers"]:
            _graph_state["layers"][layer_id]["params"] = {
                **_graph_state["layers"][layer_id].get("params", {}),
                **params,
            }

    elif op_type == "update_layer_position":
        layer_id = payload.get("id")
        position = payload.get("position")
        if layer_id and position and layer_id in _graph_state["layers"]:
            _graph_state["layers"][layer_id]["position"] = position

    elif op_type == "add_edge":
        edge = payload.get("edge")
        if edge and "id" in edge:
            _graph_state["edges"] = [
                e for e in _graph_state["edges"] if e.get("id") != edge["id"]
            ]
            _graph_state["edges"].append(edge)

    elif op_type == "remove_edge":
        edge_id = payload.get("id")
        if edge_id:
            _graph_state["edges"] = [
                e for e in _graph_state["edges"] if e.get("id") != edge_id
            ]

    elif op_type == "load_graph":
        layers = payload.get("layers", {})
        edges = payload.get("edges", [])
        _graph_state["layers"] = layers
        _graph_state["edges"] = edges


def register_handlers(socketio: SocketIO):
    @socketio.on("connect")
    def handle_connect(auth=None):
        global _join_counter
        sid = flask_request.sid
        client_id = (auth or {}).get("clientId")

        with _state_lock:
            # Evict any stale session for this clientId immediately so a
            # page reload never shows a ghost user.
            if client_id:
                stale_sid = next(
                    (s for s, u in _connected_users.items()
                     if u.get("clientId") == client_id),
                    None,
                )
                if stale_sid:
                    stale_user = _connected_users.pop(stale_sid)
                    emit("user_left", {"userId": stale_user["userId"]},
                         to=GLOBAL_ROOM)

            # Reuse the same identity if this clientId has connected before
            # so user numbers stay stable across reloads.
            if client_id and client_id in _client_registry:
                identity = _client_registry[client_id]
                user_id = identity["userId"]
                color = identity["color"]
                name = identity["name"]
            else:
                color = COLLAB_COLORS[_join_counter % len(COLLAB_COLORS)]
                user_index = _join_counter + 1
                _join_counter += 1
                user_id = str(uuid.uuid4())[:8]
                name = f"User {user_index}"
                if client_id:
                    _client_registry[client_id] = {
                        "userId": user_id,
                        "color": color,
                        "name": name,
                    }

            user_info = {
                "userId": user_id,
                "color": color,
                "name": name,
                "sid": sid,
                "clientId": client_id,
            }
            _connected_users[sid] = user_info

            current_users = [
                {"userId": u["userId"], "color": u["color"], "name": u["name"]}
                for u in _connected_users.values()
                if u["sid"] != sid
            ]

            graph_snapshot = {
                "layers": dict(_graph_state["layers"]),
                "edges": list(_graph_state["edges"]),
            }

        join_room(GLOBAL_ROOM)

        emit("welcome", {
            "userId": user_id,
            "color": color,
            "name": name,
            "users": current_users,
        })
        emit("graph_state", graph_snapshot)

        emit("user_joined", {
            "userId": user_id,
            "color": color,
            "name": name,
        }, to=GLOBAL_ROOM, skip_sid=sid)

    @socketio.on("disconnect")
    def handle_disconnect():
        sid = flask_request.sid

        with _state_lock:
            user_info = _connected_users.pop(sid, None)

        if user_info:
            emit("user_left", {"userId": user_info["userId"]}, to=GLOBAL_ROOM)

    @socketio.on("graph_op")
    def handle_graph_op(data):
        sid = flask_request.sid

        op_type = data.get("op_type")
        payload = data.get("payload", {})

        if not op_type:
            return

        with _state_lock:
            user_info = _connected_users.get(sid)
            if not user_info:
                return
            _apply_op_to_state(op_type, payload)
            user_id = user_info["userId"]

        emit("graph_op", {
            "userId": user_id,
            "op_type": op_type,
            "payload": payload,
        }, to=GLOBAL_ROOM, skip_sid=sid)

    @socketio.on("cursor_move")
    def handle_cursor_move(data):
        sid = flask_request.sid

        with _state_lock:
            user_info = _connected_users.get(sid)
            if not user_info:
                return
            user_id = user_info["userId"]

        emit("cursor_move", {
            "userId": user_id,
            "x": data.get("x", 0),
            "y": data.get("y", 0),
        }, to=GLOBAL_ROOM, skip_sid=sid)
