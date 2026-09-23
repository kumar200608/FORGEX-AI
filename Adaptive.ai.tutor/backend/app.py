from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return "Adaptive AI Tutor Backend is Running!"


@app.route("/analyze", methods=["POST"])
def analyze():

    data = request.json

    answer = data.get("answer")
    question_level = data.get("level", 1)

    # Level 1 - Original Question
    if question_level == 1:

        if answer == 15:
            return jsonify({
                "correct": True,
                "message": "Correct! You understood multiplication."
            })

        else:
            return jsonify({
                "correct": False,
                "misconception": "You may need more practice with multiplication.",
                "next_question": "What is 5 + 5 + 5?",
                "next_level": 2
            })


    # Level 2 - Easier Question
    elif question_level == 2:

        if answer == 15:
            return jsonify({
                "correct": True,
                "message": "Correct! You are improving."
            })

        else:
            return jsonify({
                "correct": False,
                "misconception": "The multiplication concept still needs practice.",
                "next_question": "What is 5 + 5?",
                "next_level": 3
            })


    # Level 3 - Basic Question
    elif question_level == 3:

        if answer == 10:
            return jsonify({
                "correct": True,
                "message": "Excellent! You understood the basic concept."
            })

        else:
            return jsonify({
                "correct": False,
                "misconception": "Let's practice basic addition first.",
                "next_question": "What is 5 + 5?",
                "next_level": 3
            })


if __name__ == "__main__":
    app.run(debug=True)