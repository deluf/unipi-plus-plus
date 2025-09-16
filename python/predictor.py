import numpy as np
import statsmodels.api as sm
import json
import matplotlib.pyplot as plt

with open("almaLaurea_2024_Pisa.json", "r", encoding="utf-8") as f:
    data_2024 = json.load(f)
with open("almaLaurea_2023_Pisa.json", "r", encoding="utf-8") as f:
    data_2023 = json.load(f)
with open("almaLaurea_2022_Pisa.json", "r", encoding="utf-8") as f:
    data_2022 = json.load(f)
data = data_2024 + data_2023 + data_2022
x = np.array([d["voto_esami_medio"] for d in data if d["voto_esami_medio"] is not None]).reshape(-1, 1)
y = np.array([d["voto_finale_medio"] for d in data if d["voto_finale_medio"] is not None])

X = np.column_stack((x**2, x, np.ones(len(x))))
model = sm.OLS(y, X).fit()

# Scatter + fitted curve
x_range = np.linspace(x.min(), x.max(), 300).reshape(-1, 1)
X_range = np.column_stack((x_range**2, x_range, np.ones(len(x_range))))
y_pred = model.predict(X_range)


plt.rc('font', family='serif')
plt.rc('font', size=12)
plt.figure(figsize=(8, 5))
plt.scatter(x, y, alpha=0.6, label="Data")
plt.plot(x_range, y_pred, color="red", linewidth=2, label="Fitted quadratic model")

plt.legend(prop={'size': 11}, loc='upper left', fancybox=False, edgecolor="black")
plt.tick_params(direction="in", length=5, width=1.5)
plt.grid(alpha=0.5)
axxx = plt.gca()
for spine in axxx.spines.values():
	spine.set_linewidth(2)  # Set the border thickness (e.g., 2.5)

plt.xlabel("Voto esami medio")
plt.ylabel("Voto finale medio")
plt.title("Dati AlmaLaurea dei laureati UniPi (aggregati per corso) nel 2022, 2023 e 2024", fontsize=11)
plt.grid(True)
plt.show()


def predict(x_new):
    #alpha = 0.05
    ses = [4.028666215623055, 3.3386414826098014, 2.77486491572064, 2.344159539859904, 2.047313529760881, 1.8716019067649696, 1.7881642893469032, 1.7601429216805495, 1.7554935896873967, 1.7550205493971243, 1.7547579109517102, 1.766210287167336, 1.8154961601834838, 1.9385997815754714, 2.170205237468932, 2.5316412151849015]
    x2 = -0.27050574
    x1 = 17.42744807
    const = -166.18817266
    q = 1.9657953681092568

    pred_val = x_new*x_new*x2 + x_new*x1 + const
    approx_se = ses[int(x_new) - 18]
    lower = pred_val - q * approx_se
    upper = pred_val + q * approx_se

    print(f"Input: {x_new} - Prediction: {pred_val} +/- [{lower}, {upper}]")

predict(18)
predict(19)
predict(20)
predict(21)
predict(22)
predict(23)
predict(24)
predict(25)
predict(26)
predict(27)
predict(28)
predict(29)
predict(30)
predict(31)
predict(32)
predict(33)
