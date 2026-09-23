import os
import re
import json
import sqlite3
import webbrowser
from datetime import datetime, timedelta
from threading import Timer

from flask import Flask, request, jsonify, render_template_string
from dotenv import load_dotenv

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None


# =========================================================
# CHRONOMIND AI
# =========================================================

load_dotenv()
app = Flask(__name__)

DATABASE_FOLDER = os.path.join(
    os.path.expanduser("~"),
    "CHRONOMIND_AI_DATABASE"
)

os.makedirs(DATABASE_FOLDER, exist_ok=True)

DATABASE = os.path.join(
    DATABASE_FOLDER,
    "chronomind_complete.db"
)


# =========================================================
# DATABASE FUNCTIONS
# =========================================================

def get_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def create_database():
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            memory_key TEXT NOT NULL,
            category TEXT NOT NULL,
            fact TEXT NOT NULL,
            value TEXT NOT NULL,
            original_text TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            deadline_at TEXT,
            notification_sent INTEGER DEFAULT 0
        )
    """)

    columns = {
        row["name"]
        for row in connection.execute("PRAGMA table_info(memories)")
    }

    if "deadline_at" not in columns:
        connection.execute(
            "ALTER TABLE memories ADD COLUMN deadline_at TEXT"
        )

    if "notification_sent" not in columns:
        connection.execute(
            "ALTER TABLE memories ADD COLUMN notification_sent INTEGER DEFAULT 0"
        )

    connection.commit()
    connection.close()


def get_all_memories():
    connection = get_connection()

    rows = connection.execute("""
        SELECT *
        FROM memories
        ORDER BY id DESC
    """).fetchall()

    connection.close()

    return [dict(row) for row in rows]


def get_active_memories():
    connection = get_connection()

    rows = connection.execute("""
        SELECT *
        FROM memories
        WHERE status = 'ACTIVE'
        ORDER BY id DESC
    """).fetchall()

    connection.close()

    return [dict(row) for row in rows]


# =========================================================
# OPENAI CONFIGURATION
# =========================================================

API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

client = None

if API_KEY and OpenAI:
    client = OpenAI(api_key=API_KEY)


# =========================================================
# MEMORY EXTRACTION
# =========================================================

def local_extract(text):
    lower_text = text.lower()

    if any(word in lower_text for word in [
        "favorite color",
        "favourite colour",
        "favorite colour",
        "favourite color"
    ]):

        parts = re.split(
            r"\b(?:is|are)\b",
            text,
            maxsplit=1,
            flags=re.IGNORECASE
        )

        value = parts[1].strip() if len(parts) > 1 else text

        return {
            "memory_key": "favorite_color",
            "category": "Personal",
            "fact": "favorite colour",
            "value": value
        }

    if "deadline" in lower_text:

        match = re.search(
            r"my\s+(.+?)\s+deadline",
            text,
            re.IGNORECASE
        )

        project = match.group(1).strip() if match else "project"

        value_match = re.search(
            r"\b(?:is|on)\s+(.+)$",
            text,
            re.IGNORECASE
        )

        value = (
            value_match.group(1).strip()
            if value_match
            else text
        )

        return {
            "memory_key": (
                project.lower().replace(" ", "_")
                + "_deadline"
            ),
            "category": "Deadline",
            "fact": project + " project deadline",
            "value": value
        }

    words = re.findall(
        r"[A-Za-z0-9]+",
        lower_text
    )

    stop_words = {
        "i", "am", "is", "are", "the", "a", "an",
        "my", "me", "to", "and", "of", "in", "on",
        "for", "with", "have", "has", "this", "that",
        "it", "was", "be", "as"
    }

    key_words = [
        word for word in words
        if word not in stop_words
    ]

    memory_key = "_".join(key_words)[:80]

    if not memory_key:
        memory_key = "general_memory"

    return {
        "memory_key": memory_key,
        "category": "General",
        "fact": "user information",
        "value": text
    }


def extract_memory(text):

    if not client:
        return local_extract(text)

    prompt = f"""
Extract the main memory from the following sentence.

Return JSON only in this format:

{{
    "memory_key": "stable key",
    "category": "category",
    "fact": "fact",
    "value": "value"
}}

Use favorite_color for favourite or favorite colour.
Use a stable project deadline key.

User message:
{text}
"""

    try:

        result = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "Extract structured memories."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0
        )

        content = result.choices[0].message.content.strip()

        content = content.replace(
            "```json",
            ""
        ).replace(
            "```",
            ""
        ).strip()

        data = json.loads(content)

        required_keys = [
            "memory_key",
            "category",
            "fact",
            "value"
        ]

        if all(key in data for key in required_keys):
            return data

    except Exception as error:
        print("Memory extraction error:", error)

    return local_extract(text)


# =========================================================
# STORE MEMORY
# =========================================================

def store_memory(data, original_text, deadline_at):

    connection = get_connection()

    old_memory = connection.execute("""
        SELECT *
        FROM memories
        WHERE memory_key = ?
        AND status = 'ACTIVE'
        ORDER BY id DESC
        LIMIT 1
    """, (data["memory_key"],)).fetchone()

    if old_memory:

        old_value = str(old_memory["value"]).strip().lower()
        new_value = str(data["value"]).strip().lower()

        old_deadline = old_memory["deadline_at"] or ""
        new_deadline = deadline_at or ""

        if (
            old_value == new_value
            and old_deadline == new_deadline
        ):

            connection.close()

            return {
                "success": True,
                "message": "This memory already exists.",
                "memory_type": "DUPLICATE"
            }

    if old_memory:

        connection.execute("""
            UPDATE memories
            SET status = 'HISTORY'
            WHERE id = ?
        """, (old_memory["id"],))

        memory_type = "UPDATED"

    else:
        memory_type = "NEW"

    created_at = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    connection.execute("""
        INSERT INTO memories (
            memory_key,
            category,
            fact,
            value,
            original_text,
            status,
            created_at,
            deadline_at,
            notification_sent
        )
        VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?, 0)
    """, (
        data["memory_key"],
        data["category"],
        data["fact"],
        data["value"],
        original_text,
        created_at,
        deadline_at
    ))

    connection.commit()
    connection.close()

    if memory_type == "UPDATED":

        message = (
            "Memory updated successfully. "
            "Previous information moved to HISTORY."
        )

    else:

        message = "New memory saved successfully."

    return {
        "success": True,
        "message": message,
        "memory_type": memory_type
    }


# =========================================================
# QUESTION MATCHING
# =========================================================

def get_words(text):

    aliases = {
        "colour": "color",
        "favourite": "favorite"
    }

    stop_words = {
        "i", "am", "is", "are", "the", "a", "an",
        "my", "me", "what", "which", "who",
        "where", "when", "why", "how", "do",
        "does", "did", "tell", "give", "please",
        "can", "you", "about", "to", "and",
        "of", "in", "on", "for", "with",
        "have", "has", "this", "that", "it",
        "was", "be", "your", "mine"
    }

    result = set()

    for word in re.findall(
        r"[A-Za-z0-9]+",
        text.lower()
    ):

        if word not in stop_words:
            result.add(aliases.get(word, word))

    return result


def find_matching_memories(question, memories):

    question_words = get_words(question)

    scored_memories = []

    for memory in memories:

        combined_text = " ".join(
            str(memory.get(key, ""))
            for key in [
                "memory_key",
                "category",
                "fact",
                "value",
                "original_text"
            ]
        )

        memory_words = get_words(combined_text)

        score = len(question_words & memory_words)

        if score > 0:
            scored_memories.append(
                (score, memory)
            )

    if not scored_memories:
        return []

    highest_score = max(
        score for score, memory in scored_memories
    )

    return [
        memory
        for score, memory in scored_memories
        if score == highest_score
    ][:5]


def local_answer(question, matching_memories):

    answers = []

    for memory in matching_memories:

        if (
            "color" in question.lower()
            or "colour" in question.lower()
        ):

            answers.append(
                f"Your favorite colour is {memory['value']}."
            )

        else:

            answers.append(
                f"Your {memory['fact']} is {memory['value']}."
            )

    return "\n".join(answers)


def answer_question(question):

    memories = get_active_memories()

    matching_memories = find_matching_memories(
        question,
        memories
    )

    if not matching_memories:

        return (
            "I could not find the answer "
            "in your active memories."
        )

    if not client:

        return local_answer(
            question,
            matching_memories
        )

    context = "\n".join(
        f"Fact: {memory['fact']}\n"
        f"Value: {memory['value']}"
        for memory in matching_memories
    )

    prompt = f"""
Answer only using the following ACTIVE memories.

Use 'your', not 'my'.
Answer only the requested information.
Keep the answer concise.

ACTIVE MEMORIES:
{context}

QUESTION:
{question}
"""

    try:

        result = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are CHRONOMIND AI."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2
        )

        answer = result.choices[0].message.content.strip()

        answer = re.sub(
            r"^User information:\s*my\b",
            "Your",
            answer,
            flags=re.IGNORECASE
        )

        return answer

    except Exception as error:

        print("Answer error:", error)

        return local_answer(
            question,
            matching_memories
        )


# =========================================================
# NOTIFICATIONS
# =========================================================

def get_due_notifications():

    current_time = datetime.now()

    connection = get_connection()

    rows = connection.execute("""
        SELECT *
        FROM memories
        WHERE status = 'ACTIVE'
        AND deadline_at IS NOT NULL
    """).fetchall()

    notifications = []
    new_notifications = []

    for row in rows:

        try:

            deadline = datetime.strptime(
                row["deadline_at"],
                "%Y-%m-%d %H:%M"
            )

            reminder_start = deadline - timedelta(days=1)

            if current_time < reminder_start:
                continue

            if current_time > deadline:
                status = "OVERDUE"
            else:
                status = "DEADLINE REMINDER"

            item = {
                "id": row["id"],
                "message": (
                    f"{status}\n"
                    f"Task: {row['fact']} - {row['value']}\n"
                    f"Deadline: {row['deadline_at']}"
                ),
                "status": status
            }

            notifications.append(item)

            notification_sent = (
                row["notification_sent"] or 0
            )

            # Browser popup appears only once after overdue
            if (
                status == "OVERDUE"
                and notification_sent == 0
            ):

                new_notifications.append(item)

                connection.execute("""
                    UPDATE memories
                    SET notification_sent = 1
                    WHERE id = ?
                """, (row["id"],))

        except (ValueError, TypeError):
            pass

    connection.commit()
    connection.close()

    return {
        "notifications": notifications,
        "new_notifications": new_notifications
    }


# =========================================================
# HTML WEBSITE
# =========================================================

HTML = r"""
<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<title>CHRONOMIND AI</title>

<style>

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    min-height: 100vh;
    font-family: Arial, sans-serif;
    color: white;
    background: linear-gradient(
        135deg,
        #080b20,
        #101b3d,
        #22113d
    );
}

.container {
    width: 92%;
    max-width: 1200px;
    margin: auto;
    padding: 25px;
}

.header {
    text-align: center;
}

.header h1 {
    color: #56e0ff;
}

.grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.card {
    background: #141b3df5;
    border: 1px solid #384b83;
    border-radius: 15px;
    padding: 22px;
    margin: 15px 0;
}

h2 {
    color: #56e0ff;
}

textarea,
input {
    width: 100%;
    padding: 12px;
    margin: 8px 0;
    color: white;
    background: #0b1230;
    border: 1px solid #53659c;
    border-radius: 8px;
}

button {
    padding: 11px 16px;
    margin-top: 10px;
    color: white;
    background: #347ff2;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
}

button:hover {
    opacity: 0.85;
}

.delete {
    background: #d93636;
}

.message,
.notification {
    padding: 13px;
    margin-top: 12px;
    border-radius: 8px;
    white-space: pre-wrap;
}

.answer {
    background: #172d59;
    border: 1px solid #56e0ff;
}

.notification {
    display: none;
    background: #67451b;
    border: 1px solid #ffc078;
}

.memory {
    padding: 15px;
    margin: 12px 0;
    overflow-wrap: anywhere;
    background: #0c1535;
    border: 1px solid #3e5087;
    border-radius: 10px;
}

.active {
    border-left: 5px solid #2dd4a0;
}

.history {
    border-left: 5px solid #f0a04b;
}

.badge {
    padding: 5px 9px;
    border-radius: 20px;
    font-size: 12px;
}

.badge-active {
    color: #62f5bd;
    background: #145c49;
}

.badge-history {
    color: #ffc078;
    background: #69401b;
}

.small {
    color: #c5c9e8;
}

@media (max-width: 750px) {

    .grid {
        grid-template-columns: 1fr;
    }

}

</style>

</head>

<body>

<div class="container">

    <div class="header">
        <h1>CHRONOMIND AI</h1>
        <p class="small">
            Time-Aware and Contradiction-Aware Memory Assistant
        </p>
    </div>

    <div id="notifications"
         class="notification">
    </div>

    <div class="grid">

        <div class="card">

            <h2>Save Memory</h2>

            <textarea
                id="memoryText"
                placeholder="Example: My Java project deadline is Tuesday">
            </textarea>

            <label>Deadline Date:</label>

            <input
                id="deadlineDate"
                type="date">

            <label>Deadline Time:</label>

            <input
                id="deadlineTime"
                type="time">

            <button onclick="saveMemory()">
                Save Memory
            </button>

            <div id="saveMessage"></div>

        </div>


        <div class="card">

            <h2>Ask CHRONOMIND AI</h2>

            <input
                id="question"
                placeholder="Example: What is my favorite colour?">

            <button onclick="askAI()">
                Ask AI
            </button>

            <div
                id="answerMessage"
                class="message answer">

                Ask a question to see the answer.

            </div>

        </div>

    </div>


    <div class="card">

        <h2>Stored Memories</h2>

        <div id="memories">
            Loading...
        </div>

    </div>

</div>


<script>


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function showMessage(
    elementID,
    text,
    className = "message"
) {

    const element = document.getElementById(elementID);

    element.textContent = text;
    element.className = className;
    element.style.display = "block";

}


// =========================================================
// SAVE MEMORY
// =========================================================

async function saveMemory() {

    const text = document
        .getElementById("memoryText")
        .value
        .trim();

    const date = document
        .getElementById("deadlineDate")
        .value;

    const time = document
        .getElementById("deadlineTime")
        .value;

    if (!text) {

        showMessage(
            "saveMessage",
            "Please enter a memory."
        );

        return;

    }

    if (
        (date && !time) ||
        (!date && time)
    ) {

        showMessage(
            "saveMessage",
            "Enter both deadline date and time."
        );

        return;

    }

    const deadline_at =
        date && time
            ? date + " " + time
            : null;

    try {

        const response = await fetch(
            "/api/add_memory",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: text,
                    deadline_at: deadline_at
                })
            }
        );

        const result = await response.json();

        showMessage(
            "saveMessage",
            result.message
        );

        if (result.success) {

            document.getElementById("memoryText").value = "";
            document.getElementById("deadlineDate").value = "";
            document.getElementById("deadlineTime").value = "";

            loadMemories();
            checkNotifications();

        }

    } catch (error) {

        showMessage(
            "saveMessage",
            "Unable to save memory."
        );

        console.error(error);

    }

}


// =========================================================
// ASK AI
// =========================================================

async function askAI() {

    const question = document
        .getElementById("question")
        .value
        .trim();

    if (!question) {

        showMessage(
            "answerMessage",
            "Please enter a question.",
            "message answer"
        );

        return;

    }

    try {

        const response = await fetch(
            "/api/ask",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: question
                })
            }
        );

        const result = await response.json();

        showMessage(
            "answerMessage",
            result.answer,
            "message answer"
        );

    } catch (error) {

        showMessage(
            "answerMessage",
            "Unable to get an answer.",
            "message answer"
        );

        console.error(error);

    }

}


// =========================================================
// DELETE MEMORY
// =========================================================

async function deleteMemory(memoryID) {

    const confirmation = confirm(
        "Are you sure you want to permanently delete this memory?"
    );

    if (!confirmation) {
        return;
    }

    try {

        const response = await fetch(
            "/api/delete_memory/" + memoryID,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        alert(result.message);

        if (result.success) {

            loadMemories();
            checkNotifications();

        }

    } catch (error) {

        alert("Unable to delete the memory.");

        console.error(error);

    }

}


// =========================================================
// LOAD MEMORIES
// =========================================================

async function loadMemories() {

    const container = document.getElementById("memories");

    try {

        const response = await fetch(
            "/api/memories"
        );

        const result = await response.json();

        if (!result.memories.length) {

            container.innerHTML =
                "<p class='small'>No memories saved yet.</p>";

            return;

        }

        container.innerHTML = "";

        result.memories.forEach(memory => {

            const div = document.createElement("div");

            div.className =
                "memory " +
                (
                    memory.status === "ACTIVE"
                        ? "active"
                        : "history"
                );

            const badge =
                memory.status === "ACTIVE"
                    ? "<span class='badge badge-active'>ACTIVE</span>"
                    : "<span class='badge badge-history'>HISTORY</span>";

            const deadline =
                memory.deadline_at
                    ? `
                        <p>
                            <b>Deadline:</b>
                            ${escapeHTML(memory.deadline_at)}
                        </p>
                      `
                    : "";

            div.innerHTML = `

                ${badge}

                <p>
                    <b>Category:</b>
                    ${escapeHTML(memory.category)}
                </p>

                <p>
                    <b>Fact:</b>
                    ${escapeHTML(memory.fact)}
                </p>

                <p>
                    <b>Value:</b>
                    ${escapeHTML(memory.value)}
                </p>

                ${deadline}

                <p>
                    <b>Original Text:</b>
                    ${escapeHTML(memory.original_text)}
                </p>

                <p class="small">
                    Saved:
                    ${escapeHTML(memory.created_at)}
                </p>

                <button
                    class="delete"
                    onclick="deleteMemory(${memory.id})">

                    Delete Memory

                </button>

            `;

            container.appendChild(div);

        });

    } catch (error) {

        container.textContent =
            "Unable to load memories.";

        console.error(error);

    }

}


// =========================================================
// CHECK NOTIFICATIONS
// =========================================================

async function checkNotifications() {

    try {

        const response = await fetch(
            "/api/notifications"
        );

        const result = await response.json();

        const notificationBox =
            document.getElementById("notifications");

        if (result.notifications.length > 0) {

            notificationBox.textContent =
                result.notifications
                    .map(item => item.message)
                    .join(
                        "\n\n----------------\n\n"
                    );

            notificationBox.style.display = "block";

        } else {

            notificationBox.style.display = "none";

        }


        if (
            result.new_notifications.length > 0 &&
            "Notification" in window
        ) {

            if (
                Notification.permission === "default"
            ) {

                await Notification.requestPermission();

            }

            if (
                Notification.permission === "granted"
            ) {

                result.new_notifications.forEach(item => {

                    new Notification(
                        "CHRONOMIND AI - OVERDUE",
                        {
                            body: item.message
                        }
                    );

                });

            }

        }

    } catch (error) {

        console.error(
            "Notification error:",
            error
        );

    }

}


// =========================================================
// PAGE START
// =========================================================

window.onload = function() {

    loadMemories();
    checkNotifications();

    setInterval(
        checkNotifications,
        10000
    );

};


</script>

</body>

</html>
"""


# =========================================================
# FLASK ROUTES
# =========================================================

@app.route("/")
def home():

    return render_template_string(HTML)


@app.route(
    "/api/add_memory",
    methods=["POST"]
)
def add_memory():

    data = request.get_json(
        silent=True
    ) or {}

    text = str(
        data.get("text", "")
    ).strip()

    deadline_at = data.get(
        "deadline_at"
    )

    if not text:

        return jsonify(
            success=False,
            message="Memory cannot be empty."
        ), 400

    if deadline_at:

        try:

            datetime.strptime(
                deadline_at,
                "%Y-%m-%d %H:%M"
            )

        except ValueError:

            return jsonify(
                success=False,
                message="Invalid deadline date or time."
            ), 400

    memory_data = extract_memory(text)

    result = store_memory(
        memory_data,
        text,
        deadline_at
    )

    return jsonify(result)


@app.route("/api/memories")
def memories():

    return jsonify(
        success=True,
        memories=get_all_memories()
    )


@app.route(
    "/api/ask",
    methods=["POST"]
)
def ask():

    data = request.get_json(
        silent=True
    ) or {}

    question = str(
        data.get("question", "")
    ).strip()

    if not question:

        return jsonify(
            success=False,
            answer="Please enter a question."
        ), 400

    answer = answer_question(question)

    return jsonify(
        success=True,
        answer=answer
    )


@app.route("/api/notifications")
def notifications():

    result = get_due_notifications()

    return jsonify(
        success=True,
        **result
    )


# =========================================================
# DELETE MEMORY ROUTE
# =========================================================

@app.route(
    "/api/delete_memory/<int:memory_id>",
    methods=["DELETE"]
)
def delete_memory(memory_id):

    connection = get_connection()

    memory = connection.execute("""
        SELECT id
        FROM memories
        WHERE id = ?
    """, (memory_id,)).fetchone()

    if not memory:

        connection.close()

        return jsonify(
            success=False,
            message="Memory not found."
        ), 404

    connection.execute("""
        DELETE FROM memories
        WHERE id = ?
    """, (memory_id,))

    connection.commit()
    connection.close()

    return jsonify(
        success=True,
        message="Memory deleted successfully."
    )


# =========================================================
# START APPLICATION
# =========================================================

if __name__ == "__main__":

    create_database()

    print("=" * 60)
    print("CHRONOMIND AI STARTING")
    print("Database location:")
    print(DATABASE)
    print()
    print("Website:")
    print("http://127.0.0.1:5000")
    print("=" * 60)

    Timer(
        1.5,
        lambda: webbrowser.open(
            "http://127.0.0.1:5000"
        )
    ).start()

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False,
        use_reloader=False
    )