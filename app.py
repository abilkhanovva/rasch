from flask import Flask, render_template, request, jsonify, send_file
import pandas as pd
import numpy as np
from io import BytesIO
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

def rasch_calculate(students):
    """
    Rasch modeli bo'yicha o'quvchilar ballarini hisoblash.
    """
    if not students:
        return pd.DataFrame()
        
    try:
        # Ma'lumotlarni DataFramega o'tkazish
        df = pd.DataFrame([s["answers"] for s in students], dtype=np.float64)
        names = [s["name"] for s in students]
    except Exception as e:
        print(f"DataFrame xatosi: {e}")
        return pd.DataFrame()

    N, K = df.shape 
    if K == 0:
        return pd.DataFrame()

    # 1. Savollar qiyinligini hisoblash (beta)
    correct_per_item = df.sum(axis=0)
    p_j = (correct_per_item + 0.1) / (N + 0.2)
    beta_j = np.log((1 - p_j) / p_j)
    
    # 2. Vaznlarni aniqlash
    weights = beta_j - beta_j.min() + 1
    
    # 3. Vaznli ballarni hisoblash
    S_i = df.mul(weights.values, axis=1).sum(axis=1)
    W_total = weights.sum()

    # 4. Theta (Logit) ko'rsatkichi
    adj = W_total / (K * 2) if K > 0 else 1.0
    theta = np.log((S_i + adj) / (W_total - S_i + adj))

    # 5. Standartlashtirish (Z-score)
    mu = theta.mean()
    sigma = theta.std(ddof=1)
    if pd.isna(sigma) or sigma == 0: 
        sigma = 1.0
    
    z_scores = (theta - mu) / sigma

    # 6. Yakuniy ball (50 + 10z) - 100 ballik tizimga yaqinlashtirish
    final_ball = 50 + (z_scores * 10)
    final_ball = final_ball.clip(0, 100)

    result = pd.DataFrame({
        "name": names,
        "raw_score": df.sum(axis=1).astype(int),
        "weighted_score": S_i.round(2),
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
            return jsonify({"error": "Ma'lumot yuborilmadi"}), 400
            
        results_df = rasch_calculate(data["students"])
        
        if results_df.empty:
            return jsonify({"error": "Ma'lumot yetarli emas"}), 400
            
        return jsonify(results_df.to_dict(orient="records"))
        
    except Exception as e:
        print(f"Calculate xatosi: {str(e)}")
        return jsonify({"error": "Serverda xatolik yuz berdi"}), 500

@app.route("/download_excel", methods=["POST"])
def download_excel():
    try:
        data = request.get_json()
        if not data or "students" not in data:
            return jsonify({"error": "Ma'lumot topilmadi"}), 400
            
        results_df = rasch_calculate(data["students"])
        
        output = BytesIO()
        
        # Xatolikni oldini olish uchun engine tanlashni tekshiramiz
        try:
            writer = pd.ExcelWriter(output, engine='xlsxwriter')
        except:
            # Agar xlsxwriter bo'lmasa, openpyxl ishlatishga urinib ko'radi
            writer = pd.ExcelWriter(output, engine='openpyxl')

        results_df.to_excel(writer, index=False, sheet_name='Natijalar')
        
        # Formatlash (Faqat xlsxwriter bo'lsa ishlaydi)
        if writer.engine == 'xlsxwriter':
            workbook  = writer.book
            worksheet = writer.sheets['Natijalar']
            header_format = workbook.add_format({'bold': True, 'bg_color': '#D7E4BC', 'border': 1})
            for col_num, value in enumerate(results_df.columns.values):
                worksheet.write(0, col_num, value, header_format)
                worksheet.set_column(col_num, col_num, 15)
        
        writer.close()
        output.seek(0)
        
        return send_file(
            output,
            download_name="rasch_natijalari.xlsx",
            as_attachment=True,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        print(f"Download xatosi: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)