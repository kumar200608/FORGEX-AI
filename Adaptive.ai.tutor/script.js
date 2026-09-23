let currentQuestion = 1;

let attempted = 0;
let correct = 0;
let mistakes = 0;


// ===============================
// START LEARNING
// ===============================

function startLearning() {

    document.getElementById("homePage").style.display = "none";

    document.getElementById("questionPage").style.display = "block";

    currentQuestion = 1;

    document.getElementById("questionText").innerText =
        "What is 5 × 3?";

    document.getElementById("answer").value = "";

    document.getElementById("feedback").innerHTML = "";

}
// ===============================
// RESET AI FLOW
// ===============================

function resetAIFlow() {

    let steps = ["step1", "step2", "step3", "step4", "step5"];

    steps.forEach(function(step) {

        let element = document.getElementById(step);

        if (element) {
            element.style.background = "white";
        }

    });
}


// ===============================
// AI FLOW
// ===============================

function showStep(step) {

    let element = document.getElementById(step);

    if (element) {
        element.style.background = "#dbeafe";
    }
}


// ===============================
// CHECK ANSWER
// ===============================

async function checkAnswer() {

    let answer = Number(
        document.getElementById("answer").value
    );

    let feedback =
        document.getElementById("feedback");

    let question =
        document.getElementById("questionText");


    if (document.getElementById("answer").value === "") {

        feedback.innerHTML =
            "⚠️ Please enter an answer.";

        return;
    }


    attempted++;


    try {

        // STEP 1
        showStep("step1");


        const response = await fetch(
            "http://127.0.0.1:5000/analyze",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    answer: answer,

                    level: currentQuestion

                })
            }
        );


        const result = await response.json();


        // STEP 2
        showStep("step2");


        // STEP 3
        showStep("step3");


        if (result.correct) {

    correct++;

    document.getElementById("verificationStatus").innerText =
        "✅ Question & Answer Verified";

    feedback.innerHTML =
        "✅ " + result.message;

} else {

    mistakes++;

    document.getElementById("verificationStatus").innerText =
        "🔄 New Personalized Question Generated";

    currentQuestion = result.next_level;

    question.innerText =
        result.next_question;

    feedback.innerHTML =
        "❌ Incorrect.<br><br>" +
        "🔍 AI Analysis: " +
        result.misconception +
        "<br><br>" +
        "🎯 Personalized Question generated.";
}

        // STEP 5
        showStep("step5");


        updateProgress();


        // Clear answer box
        document.getElementById("answer").value = "";


    }

    catch (error) {

        console.error(error);


        feedback.innerHTML =

            "⚠️ Backend connection failed.<br><br>" +

            "Please make sure the Python server is running.";

    }

}


// ===============================
// UPDATE PROGRESS
// ===============================

function updateProgress() {


    document.getElementById("attempted").innerText =
        attempted;


    document.getElementById("correct").innerText =
        correct;


    document.getElementById("mistakes").innerText =
        mistakes;


    let progress = 0;


    if (attempted > 0) {

        progress =
            Math.round(
                (correct / attempted) * 100
            );

    }


    document.getElementById("progressFill").style.width =
        progress + "%";


    document.getElementById("progressText").innerText =
        progress + "% Complete";


    document.getElementById("finalAttempted").innerText =
        attempted;


    document.getElementById("finalCorrect").innerText =
        correct;


    document.getElementById("finalMistakes").innerText =
        mistakes;


    document.getElementById("finalProgress").innerText =
        progress + "%";


    if (progress >= 80) {

        document.getElementById("finalStatus").innerText =
            "Good Understanding 🎉";

    }

    else if (progress >= 50) {

        document.getElementById("finalStatus").innerText =
            "Improving 📚";

    }

    else {

        document.getElementById("finalStatus").innerText =
            "Needs More Practice 📖";

    }

}


// ===============================
// RESET TUTOR
// ===============================

function resetTutor() {


    currentQuestion = 1;

    attempted = 0;

    correct = 0;

    mistakes = 0;


    document.getElementById("homePage").style.display =
        "block";


    document.getElementById("questionPage").style.display =
        "none";


    document.getElementById("questionText").innerText =
        "What is 5 × 3?";


    document.getElementById("answer").value =
        "";


    document.getElementById("feedback").innerHTML =
        "";


    resetAIFlow();


    updateProgress();

}