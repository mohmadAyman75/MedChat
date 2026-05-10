from dosage_calculator import train_safety_classifier, build_features
from sklearn.metrics import ConfusionMatrixDisplay, classification_report
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
import json

DATA_PATH = "Deep_seek_data_copy.json"

# تدريب وجيب النتائج
clf, le, y_test, y_pred = train_safety_classifier(DATA_PATH)

# ─────────────────────────────────────────────
# 1. Classification Report
# ─────────────────────────────────────────────
print(classification_report(y_test, y_pred, target_names=le.classes_))

# ─────────────────────────────────────────────
# 2. Confusion Matrix
# ─────────────────────────────────────────────
ConfusionMatrixDisplay.from_predictions(
    y_test, y_pred,
    display_labels=le.classes_,
    cmap="Blues"
)
plt.title("Safety Classifier — Confusion Matrix")
plt.tight_layout()
plt.savefig("confusion_matrix.png")
plt.show()

# ─────────────────────────────────────────────
# 3. Feature Importance Bar Chart
# ─────────────────────────────────────────────
feature_names = ["age", "weight", "gender", "num_conditions",
                 "kidney", "liver", "diabetes", "heart", "liver_disease", "kidney_disease"]

pd.DataFrame({
    "feature": feature_names,
    "importance": clf.feature_importances_
}).sort_values("importance", ascending=True).plot.barh(
    x="feature", y="importance",
    title="Feature Importance",
    figsize=(8, 5)
)
plt.tight_layout()
plt.savefig("feature_importance.png")
plt.show()

# ─────────────────────────────────────────────
# 4. Correlation Heatmap
# ─────────────────────────────────────────────
with open(DATA_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

X = [build_features(r) for r in data]
df_features = pd.DataFrame(X, columns=feature_names)

plt.figure(figsize=(10, 8))
sns.heatmap(
    df_features.corr(),
    annot=True,
    fmt=".2f",
    cmap="coolwarm",
    square=True
)
plt.title("Feature Correlation Heatmap")
plt.tight_layout()
plt.savefig("correlation_heatmap.png")
plt.show()

# ─────────────────────────────────────────────
# 5. Feature Importance Heatmap
# ─────────────────────────────────────────────
importance_array = clf.feature_importances_.reshape(1, -1)

plt.figure(figsize=(12, 3))
sns.heatmap(
    importance_array,
    annot=True,
    fmt=".3f",
    cmap="YlOrRd",
    xticklabels=feature_names,
    yticklabels=["importance"]
)
plt.title("Feature Importance Heatmap")
plt.tight_layout()
plt.savefig("feature_importance_heatmap.png")
plt.show()

print(" All visualizations saved successfully!")
