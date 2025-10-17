import asyncio
import base64
import io
import json
import os
import uuid
from functools import wraps

import asyncpg
import qrcode
from sanic import Sanic, response
from sanic.log import logger

# --- App Initialization ---
app = Sanic("Esh")
app.config.CORS_ORIGINS = "*"

# --- In-memory State ---
PINNED_MESSAGE = None
WEBSOCKETS = set()


# --- Database Setup ---
async def setup_db(app, loop):
    app.ctx.db_pool = await asyncpg.create_pool(
        user=os.getenv("POSTGRES_USER", "user"),
        password=os.getenv("POSTGRES_PASSWORD", "password"),
        database=os.getenv("POSTGRES_DB", "esh"),
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=os.getenv("POSTGRES_PORT", 5432),
    )
    logger.info("Database connection pool created.")


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

        async with app.ctx.db_pool.acquire() as conn:
            user = await conn.fetchrow(
                "SELECT * FROM users WHERE user_key = $1", user_key
            )

        if not user:
            return response.json({"error": "Invalid user key"}, status=403)

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
        tasks = [ws.send(json.dumps(message)) for ws in WEBSOCKETS]
        await asyncio.gather(*tasks, return_exceptions=False)


# --- Admin Routes ---
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

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    full_url = f"{frontend_url}/init?user_key={user_key}"
    qr_img = qrcode.make(full_url)
    buffered = io.BytesIO()
    qr_img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    return response.json(
        {
            "user_id": user_id,
            "user_key": user_key,
            "qr_base64": f"data:image/png;base64,{qr_base64}",
        }
    )


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
        return response.json({"user_id": user_id, "new_balance": new_balance})
    return response.json({"error": "User not found"}, status=404)


# --- User Routes ---
@app.post("/user/login")
@auth_required
async def user_login(request):
    username = request.json.get("username")
    if not username:
        return response.json({"error": "Username cannot be empty"}, status=400)
    user = request.ctx.user

    async with app.ctx.db_pool.acquire() as conn:
        # Check if username is already taken by another user
        existing_user = await conn.fetchval(
            "SELECT 1 FROM users WHERE username = $1 AND user_id != $2",
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

    return response.json(
        {"user_id": user["user_id"], "username": username, "esh": user["esh"]}
    )


@app.get("/user/status")
@auth_required
async def user_status(request):
    user = request.ctx.user
    return response.json({"username": user["username"], "esh": user["esh"]})


@app.post("/user/chat")
@auth_required
async def user_chat(request):
    message = request.json.get("message")
    user = request.ctx.user
    await broadcast(
        {
            "type": "message",
            "from": user["username"],
            "text": message,
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

    async with app.ctx.db_pool.acquire() as conn:
        async with conn.transaction():
            from_balance = await conn.fetchval(
                "UPDATE users SET esh = esh - $1 WHERE user_id = $2 RETURNING esh",
                amount,
                sender["user_id"],
            )
            to_balance = await conn.fetchval(
                "UPDATE users SET esh = esh + $1 WHERE user_id = $2 RETURNING esh",
                amount,
                to_user_id,
            )
            if to_balance is None:
                raise Exception("Recipient not found")

    await broadcast(
        {"type": "coins_update", "user_id": sender["user_id"], "esh": from_balance}
    )
    await broadcast(
        {"type": "coins_update", "user_id": to_user_id, "esh": to_balance}
    )

    return response.json({"from_balance": from_balance, "to_balance": to_balance})


@app.get("/users")
@auth_required
async def get_users(request):
    user = request.ctx.user
    async with app.ctx.db_pool.acquire() as conn:
        users = await conn.fetch("SELECT * FROM users WHERE username IS NOT NULL")

    if user["is_admin"]:
        result = [dict(u) for u in users]
    else:
        result = [
            {"user_id": u["user_id"], "username": u["username"], "is_admin": u["is_admin"]}
            for u in users
        ]
    return response.json(result)


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

    logger.info(f"WebSocket connection opened for user: {user['username']}")
    WEBSOCKETS.add(ws)

    # Send initial state
    if PINNED_MESSAGE:
        await ws.send(json.dumps({"type": "pinned", "text": PINNED_MESSAGE}))

    try:
        while True:
            # Keep connection alive
            await asyncio.sleep(60)
    finally:
        WEBSOCKETS.remove(ws)
        logger.info(f"WebSocket connection closed for user: {user['username']}")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)


