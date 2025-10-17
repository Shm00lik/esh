import asyncio
import base64
import io
import json
import os
import time
import uuid
from functools import wraps

import asyncpg
import qrcode
from sanic import Sanic, response
from sanic.log import logger
from sanic_cors import CORS

# --- App Initialization ---
app = Sanic("Esh")
CORS(app, resources={r"/*": {"origins": "*"}})

# --- In-memory State ---
PINNED_MESSAGE = None
WEBSOCKETS = set()
TIMER_STATE = {
    "end_time": None,  # Timestamp when the timer should end
    "duration": 0,     # Original duration in seconds
    "paused_at": None, # Timestamp when the timer was paused
    "is_running": False
}

# --- Timer Background Task ---
async def timer_ticker(app):
    while True:
        if TIMER_STATE["is_running"] and not TIMER_STATE["paused_at"]:
            await broadcast({"type": "timer_update", "state": TIMER_STATE})
            now = time.time()
            if now >= TIMER_STATE["end_time"]:
                TIMER_STATE["is_running"] = False
                # Send one final update
                await broadcast({"type": "timer_update", "state": TIMER_STATE})
                logger.info("Timer finished.")
        await asyncio.sleep(1)


# --- Database Setup ---
async def setup_db(app, loop):
    app.ctx.db_pool = await asyncpg.create_pool(
        user=os.getenv("POSTGRES_USER", "user"),
        password=os.getenv("POSTGRES_PASSWORD", "password"),
        database=os.getenv("POSTGRES_DB", "esh"),
        host=os.getenv("POSTGRES_HOST", "db"),
        port=os.getenv("POSTGRES_PORT", 5432),
    )
    app.add_task(timer_ticker(app))
    logger.info("Database connection pool created and timer task started.")


async def close_db(app, loop):
    await app.ctx.db_pool.close()
    logger.info("Database connection pool closed.")


app.register_listener(setup_db, "before_server_start")
app.register_listener(close_db, "after_server_stop")


# --- Authentication Decorators ---
def auth_required(handler):
    @wraps(handler)
    async def decorated_function(request, *args, **kwargs):
        user_key = request.headers.get("X-User-Key")
        if not user_key:
            return response.json({"error": "Missing X-User-Key header"}, status=401)

        user = None
        # Retry logic to handle potential db connection race on startup
        for i in range(3):
            try:
                async with app.ctx.db_pool.acquire() as conn:
                    user = await conn.fetchrow(
                        "SELECT * FROM users WHERE user_key = $1", user_key
                    )
                if user:
                    break
            except Exception as e:
                logger.error(f"DB connection error (attempt {i+1}): {e}")
                if i < 2:
                    await asyncio.sleep(0.5)
                else:
                    return response.json({"error": "Database connection failed"}, status=500)

        if not user:
            return response.json({"error": "Invalid user key"}, status=401)

        request.ctx.user = user
        return await handler(request, *args, **kwargs)

    return decorated_function


def admin_required(handler):
    @wraps(handler)
    async def decorated_function(request, *args, **kwargs):
        if not request.ctx.user["is_admin"]:
            return response.json({"error": "Admin access required"}, status=403)
        return await handler(request, *args, **kwargs)

    return decorated_function


# --- WebSocket Helper ---
async def broadcast(message):
    if WEBSOCKETS:
        tasks = [asyncio.create_task(ws.send(json.dumps(message))) for ws in WEBSOCKETS]
        for task in tasks:
            task.add_done_callback(lambda t: t.exception() and logger.error(f"WS send failed: {t.exception()}"))


async def broadcast_users(pool):
    """Fetches all users and broadcasts them."""
    async with pool.acquire() as conn:
        users = await conn.fetch("SELECT user_id, user_key, username, is_admin, esh FROM users ORDER BY username")
    await broadcast({"type": "users_update", "users": [dict(u) for u in users]})
    logger.debug("Broadcasted user list update.")


async def broadcast_leaderboard(pool):
    """Fetches top users and broadcasts the leaderboard."""
    async with pool.acquire() as conn:
        leaderboard = await conn.fetch(
            "SELECT user_id, username, esh FROM users WHERE username IS NOT NULL ORDER BY esh DESC LIMIT 10"
        )
    await broadcast({"type": "leaderboard", "users": [dict(u) for u in leaderboard]})
    logger.debug("Broadcasted leaderboard update.")


def generate_qr_for_key(user_key):
    frontend_url = os.getenv("FRONTEND_URL", "http://192.168.50.161:5173")
    full_url = f"{frontend_url}/init?user_key={user_key}"
    qr_img = qrcode.make(full_url, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
    buffered = io.BytesIO()
    qr_img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{qr_base64}"


# --- Admin Routes ---
@app.post("/admin/timer")
@auth_required
@admin_required
async def manage_timer(request):
    global TIMER_STATE
    action = request.json.get("action")
    duration_seconds = request.json.get("duration_seconds", 0)

    if action == "start":
        now = time.time()
        TIMER_STATE = {
            "end_time": now + duration_seconds,
            "duration": duration_seconds,
            "paused_at": None,
            "is_running": True
        }
        logger.info(f"Timer started for {duration_seconds} seconds.")
    elif action == "pause":
        if TIMER_STATE["is_running"]:
            if TIMER_STATE["paused_at"]:  # It's paused, so resume
                paused_duration = time.time() - TIMER_STATE["paused_at"]
                TIMER_STATE["end_time"] += paused_duration
                TIMER_STATE["paused_at"] = None
                logger.info("Timer resumed.")
            else:  # It's running, so pause
                TIMER_STATE["paused_at"] = time.time()
                logger.info("Timer paused.")
    elif action == "reset":
        TIMER_STATE = {
            "end_time": None,
            "duration": 0,
            "paused_at": None,
            "is_running": False
        }
        logger.info("Timer reset.")
    else:
        return response.json({"error": "Invalid action"}, status=400)

    await broadcast({"type": "timer_update", "state": TIMER_STATE})
    return response.json(TIMER_STATE)

@app.post("/admin/create_qr")
@auth_required
@admin_required
async def create_qr(request):
    user_id = str(uuid.uuid4())
    user_key = str(uuid.uuid4())

    async with app.ctx.db_pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO users (user_id, user_key, esh)
            VALUES ($1, $2, 100)
            """,
            user_id,
            user_key,
        )

    qr_base64 = generate_qr_for_key(user_key)
    await broadcast_users(app.ctx.db_pool)

    return response.json(
        {
            "user_id": user_id,
            "user_key": user_key,
            "qr_base64": qr_base64,
        }
    )

@app.get("/admin/qr/<user_id:str>")
@auth_required
@admin_required
async def get_user_qr(request, user_id):
    async with app.ctx.db_pool.acquire() as conn:
        user_key = await conn.fetchval("SELECT user_key FROM users WHERE user_id = $1", user_id)

    if not user_key:
        return response.json({"error": "User not found"}, status=404)

    qr_data = generate_qr_for_key(user_key)
    return response.json({"user_id": user_id, "qr_base64": qr_data})


@app.post("/admin/pin")
@auth_required
@admin_required
async def pin_message(request):
    global PINNED_MESSAGE
    PINNED_MESSAGE = request.json.get("message")
    await broadcast({"type": "pinned", "text": PINNED_MESSAGE})
    return response.json({"pinned": True})


@app.delete("/admin/pin")
@auth_required
@admin_required
async def delete_pin(request):
    global PINNED_MESSAGE
    PINNED_MESSAGE = None
    await broadcast({"type": "pin_removed"})
    return response.json({"removed": True})


@app.post("/admin/update_balance")
@auth_required
@admin_required
async def update_balance(request):
    user_id = request.json.get("user_id")
    change = int(request.json.get("change", 0))

    async with app.ctx.db_pool.acquire() as conn:
        new_balance = await conn.fetchval(
            "UPDATE users SET esh = esh + $1 WHERE user_id = $2 RETURNING esh",
            change,
            user_id,
        )

    if new_balance is not None:
        await broadcast(
            {"type": "coins_update", "user_id": user_id, "esh": new_balance}
        )
        await broadcast_leaderboard(app.ctx.db_pool)
        await broadcast_users(app.ctx.db_pool)
        return response.json({"user_id": user_id, "new_balance": new_balance})
    return response.json({"error": "User not found"}, status=404)


@app.delete("/admin/user/<user_id:str>")
@auth_required
@admin_required
async def delete_user(request, user_id):
    async with app.ctx.db_pool.acquire() as conn:
        user_to_delete = await conn.fetchrow("SELECT is_admin FROM users WHERE user_id = $1", user_id)
        if user_to_delete and user_to_delete['is_admin']:
            return response.json({"error": "Cannot delete an admin user."}, status=403)

        result = await conn.execute("DELETE FROM users WHERE user_id = $1", user_id)

    if result == 'DELETE 1':
        await broadcast_users(app.ctx.db_pool)
        await broadcast_leaderboard(app.ctx.db_pool)
        return response.json({"deleted": True})
    return response.json({"error": "User not found or could not be deleted."}, status=404)


# --- User Routes ---
@app.post("/user/login")
@auth_required
async def user_login(request):
    username = request.json.get("username")
    if not username:
        return response.json({"error": "Username cannot be empty"}, status=400)
    user = request.ctx.user

    async with app.ctx.db_pool.acquire() as conn:
        existing_user = await conn.fetchval(
            "SELECT 1 FROM users WHERE username ILIKE $1 AND user_id != $2",
            username,
            user["user_id"],
        )
        if existing_user:
            return response.json({"error": "Username is already taken"}, status=409)

        await conn.execute(
            "UPDATE users SET username = $1 WHERE user_id = $2",
            username,
            user["user_id"],
        )

    await broadcast_users(app.ctx.db_pool)
    await broadcast_leaderboard(app.ctx.db_pool)

    return response.json(
        {"user_id": user["user_id"], "username": username, "esh": user["esh"]}
    )


@app.get("/user/status")
@auth_required
async def user_status(request):
    user = request.ctx.user
    return response.json({
        "username": user["username"],
        "esh": user["esh"],
        "is_admin": user["is_admin"],
        "user_id": user["user_id"],
    })


@app.post("/user/chat")
@auth_required
async def user_chat(request):
    message = request.json.get("message")
    user = request.ctx.user
    if not user["username"]:
        return response.json({"error": "User must set a username to chat"}, status=403)

    await broadcast(
        {
            "type": "message",
            "from": user["username"],
            "text": message,
            "is_admin": user["is_admin"],
        }
    )
    return response.json({"sent": True})


@app.post("/user/transfer")
@auth_required
async def user_transfer(request):
    to_user_id = request.json.get("to_user_id")
    amount = int(request.json.get("amount", 0))
    sender = request.ctx.user

    if amount <= 0:
        return response.json({"error": "Amount must be positive"}, status=400)
    if sender["esh"] < amount:
        return response.json({"error": "Insufficient funds"}, status=400)
    if sender["user_id"] == to_user_id:
        return response.json({"error": "Cannot transfer to yourself"}, status=400)

    async with app.ctx.db_pool.acquire() as conn:
        async with conn.transaction():
            current_balance = await conn.fetchval("SELECT esh FROM users WHERE user_id = $1 FOR UPDATE",
                                                  sender["user_id"])
            if current_balance < amount:
                return response.json({"error": "Insufficient funds"}, status=400)

            from_balance = await conn.fetchval(
                "UPDATE users SET esh = esh - $1 WHERE user_id = $2 RETURNING esh",
                amount, sender["user_id"],
            )
            to_balance = await conn.fetchval(
                "UPDATE users SET esh = esh + $1 WHERE user_id = $2 RETURNING esh",
                amount, to_user_id,
            )
            if to_balance is None:
                raise Exception("Recipient not found")

    await broadcast(
        {"type": "coins_update", "user_id": sender["user_id"], "esh": from_balance}
    )
    await broadcast(
        {"type": "coins_update", "user_id": to_user_id, "esh": to_balance}
    )
    await broadcast_leaderboard(app.ctx.db_pool)
    await broadcast_users(app.ctx.db_pool)

    return response.json({"from_balance": from_balance, "to_balance": to_balance})


@app.get("/users")
@auth_required
async def get_users(request):
    user = request.ctx.user
    async with app.ctx.db_pool.acquire() as conn:
        users_records = await conn.fetch(
            "SELECT user_id, username, is_admin FROM users WHERE username IS NOT NULL AND user_id != $1",
            user['user_id'])

    return response.json([dict(u) for u in users_records])


# --- WebSocket Route ---
@app.websocket("/ws")
async def feed(request, ws):
    user_key = request.args.get("key")
    if not user_key:
        return

    async with app.ctx.db_pool.acquire() as conn:
        user = await conn.fetchrow("SELECT * FROM users WHERE user_key = $1", user_key)

    if not user:
        return

    logger.info(f"WebSocket connection opened for user: {user.get('username', user['user_key'])}")
    WEBSOCKETS.add(ws)

    try:
        if PINNED_MESSAGE:
            await ws.send(json.dumps({"type": "pinned", "text": PINNED_MESSAGE}))

        async with app.ctx.db_pool.acquire() as conn:
            users = await conn.fetch("SELECT user_id, user_key, username, is_admin, esh FROM users ORDER BY username")
            leaderboard = await conn.fetch(
                "SELECT user_id, username, esh FROM users WHERE username IS NOT NULL ORDER BY esh DESC LIMIT 10")

        await ws.send(json.dumps({"type": "users_update", "users": [dict(u) for u in users]}))
        await ws.send(json.dumps({"type": "leaderboard", "users": [dict(u) for u in leaderboard]}))
        await ws.send(json.dumps({"type": "timer_update", "state": TIMER_STATE}))


        while True:
            await ws.recv()

    except Exception as e:
        logger.error(f"WebSocket error for user {user.get('username', user['user_key'])}: {e}")
    finally:
        WEBSOCKETS.remove(ws)
        logger.info(f"WebSocket connection closed for user: {user.get('username', user['user_key'])}")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
