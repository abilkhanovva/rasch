from flask import Flask, render_template, request, jsonify, send_file
import pandas as pd
import numpy as np
from io import BytesIO
import os

app = Flask(__name__)

def rasch_calculate(students):
    df = pd.DataFrame([s["answers"] for s in students])
    eps = 1e-9
    N = len(df)

    # 1) Correct per item
    correct = df.sum(axis=0)
    p = correct / N

    # 2) Beta
    beta = np.log((1 - p + eps) / (p + eps))

    # 3) Weight
    weights = beta - beta.min() + 1

    # 4) Weighted correct
    S_i = df.mul(weights, axis=1).sum(axis=1)

    # 5) Total weight
    W_total = weights.sum()

    # 6) Weighted incorrect
    F_i = W_total - S_i

    # 7) Theta
    theta = np.log((S_i + eps) / (F_i + eps))

    # 8) Mu & sigma (Excel STDEV.S → ddof=1)
    mu = theta.mean()
    sigma = theta.std(ddof=1)

    # 9) Z-score
    Z = (theta - mu) / (sigma + eps)

    # 10) BALL
    BALL = 50 + 10 * Z

    result = pd.DataFrame({
        "name": [s["name"] for s in students],
        "theta": theta.round(6),
        "score": BALL.round(2)
    })

    return result

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/calculate", methods=["POST"])
def calculate():
    data = request.json
    students = data["students"]
    df = rasch_calculate(students)
    return jsonify(df.to_dict(orient="records"))

@app.route("/download_excel", methods=["POST"])
def download_excel():
    data = request.json
    students = data["students"]
    df = rasch_calculate(students)
    output = BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)
    return send_file(
        output,
        download_name="rasch_results.xlsx",
        as_attachment=True
    )

if __name__ == "__main__":
    # Render uchun host va port sozlamasi
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
