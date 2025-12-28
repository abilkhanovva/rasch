from flask import Flask, render_template, request, jsonify, send_file
import pandas as pd
import numpy as np
from io import BytesIO
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

def rasch_calculate(students):
    if not students or not students[0].get("answers"):
        return pd.DataFrame()
        
    df = pd.DataFrame([s["answers"] for s in students], dtype=np.float64)
    names = [s["name"] for s in students]
    N, K = df.shape

  
    correct_per_item = df.sum(axis=0)
    p_j = (correct_per_item + 0.1) / (N + 0.2)
    beta_j = np.log((1 - p_j) / p_j)
    
    weights = beta_j - beta_j.min() + 1
    
    S_i = df.mul(weights.values, axis=1).sum(axis=1)
    W_total = weights.sum()

    adj = W_total / (K - 1) if K > 1 else 1.0
    theta = np.log((S_i + adj) / (W_total - S_i + adj))

    mu = theta.mean()
    sigma = theta.std(ddof=1)
    
    if sigma == 0: sigma = 1.0
    
    z_scores = (theta - mu) / sigma

    final_ball = 50 + (z_scores * 10)

    result = pd.DataFrame({
        "name": names,
        "raw_score": df.sum(axis=1).astype(int),
        "weighted_score": S_i.round(4),
        "theta": theta.round(4),
        "score": final_ball.round(2)
    })

    return result.sort_values(by="score", ascending=False)



@app.route("/")
def index():
    return render_template("index.html")

@app.route("/calculate", methods=["POST"])
def calculate():
    try:
        data = request.get_json()
        if not data or "students" not in data:
            return jsonify({"error": "Ma'lumot topilmadi"}), 400
            
        results_df = rasch_calculate(data["students"])
        if results_df.empty:
            return jsonify([])
            
        return jsonify(results_df.to_dict(orient="records"))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/download_excel", methods=["POST"])
def download_excel():
    try:
        data = request.get_json()
        results_df = rasch_calculate(data["students"])
        
        output = BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            results_df.to_excel(writer, index=False, sheet_name='Rasch_Results')
        output.seek(0)
        
        return send_file(
            output,
            download_name="rasch_results.xlsx",
            as_attachment=True,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)