const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const Prediction = require("../models/Prediction");
const { spawn } = require("child_process");
const path = require("path");

router.post("/", verifyToken, async (req, res) => {
  const { age, gender, height, weight,duration,heart_rate, body_temp, goal } = req.body;

  // Workout suggestion (simple rule-based logic)
  let workout = "";
  if (goal === "Gain Weight") workout = "Strength Training + High Protein Diet";
  else if (goal === "Lose Weight") workout = "Cardio + HIIT";
  else workout = "Balanced Routine (Cardio + Strength)";

  // Call Python script
  
  const inputData = JSON.stringify({
    age,
    gender,
    height,
    weight,
    duration,
    heart_rate,
    body_temp
  });

  
  
  const py = spawn("python", [path.join(__dirname, "../ml/predict_calorie.py")]);
  let output = "";
  let error = "";

  py.stdin.write(inputData);
  py.stdin.end();

  py.stdout.on("data", (data) => {
    output += data.toString();
  });

  py.stderr.on("data", (data) => {
    error += data.toString();
    console.error("Python Error:", error);
  });

  py.on("close", async (code) => {
    try {
      const match = output.match(/(\{.*\})/s); // extract JSON object
      if (!match) throw new Error("No JSON output from Python");
  
      const parsed = JSON.parse(match[1]);
      const { calories, bmi } = parsed;
      const roundedCalories = Math.round(calories * 100) / 100;

  
      const prediction = new Prediction({
        user: req.user.id,
        age,
        gender,
        height,
        weight,
        body_temp,
        goal,
        roundedCalories,
        bmi,
        workout
      });
  
      await prediction.save();
  
      // 👇 Send full data back to frontend
      res.json({ roundedCalories, bmi, workout });
  
    } catch (err) {
      console.error("JSON parse error:", err);
      res.status(500).json({ error: "Failed to parse prediction result" });
    }
  });
  
});

// GET history
router.get("/history", verifyToken, async (req, res) => {
  const history = await Prediction.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(history);
});

module.exports = router;
