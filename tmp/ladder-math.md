# Equal-odds ladder games: code vs. math

Scratch notes pairing the actual decompiled C# for the four "fair" ladder games
with the LaTeX that matches it. Source files live in
`GambleWithYourFriendsAnalysis/decomp/Assembly-CSharp/`.

Notation used throughout:

- $E$ = `base.EstimatedValue`, the global "profitability" slider (shipped value `1.0`).
- $P$ = probability of reaching the point where you cash out.
- $M$ = the payout multiplier the game shows you at that point.
- EV (per unit bet) $= P \cdot M$, since a loss pays 0.

> **Headline finding:** three of the four set $M = E / P$, which gives **EV $= E$**
> (so the slider *does* tune them, it just sits at 1.0 in this build). Penguins is the
> odd one out: its multiplier is a fixed table and $E$ cancels *completely*, so its
> EV is locked to `stepMultipliers[0] = 1.0` no matter what the slider says.

---

## 1. Hi-Lo (`HiLoGame.cs`)

### Win condition (uniform roll on $[0,1)$)

```csharp
float roll = (float)base.GetSeededRandom(0).NextDouble();
// ...
if (this._isOver)        // win if roll >= threshold
    win = roll >= this.hiLoSlider.currentValue;
else                     // win if roll <= threshold
    win = roll <= this.hiLoSlider.currentValue;
```

### Payout

```csharp
double num = this._isOver
    ? (1.0 - (double)this.hiLoSlider.currentValue)   // P(win) for "over"
    : ((double)this.hiLoSlider.currentValue);        // P(win) for "under"
double multiplier = base.EstimatedValue / num;
```

### Matching math

Let the slider threshold be $t \in (0,1)$. Because `roll` is uniform on $[0,1)$:

$$P =
\begin{cases}
1 - t & \text{(Over)}\\[2pt]
t & \text{(Under)}
\end{cases}
\qquad\quad
M = \frac{E}{P}$$

$$\text{EV} = P \cdot M = P \cdot \frac{E}{P} = E \;\xrightarrow{\;E=1\;}\; 1$$

The variable `num` in the code *is* $P$ exactly, and the payout is its reciprocal
scaled by $E$.

---

## 2. Penguins / Crossy Road (`CrossyRoad.cs`)

### Crash draw and the multiplier table

```csharp
float num = (float)base.GetSeededRandom(this._currentStep * 9999).NextDouble();
if (num < this._currentCrashChance) { /* crash, payout 0 */ }
// ...
private double GetStepMultiplier(int step)
{
    return this.stepMultipliers[Mathf.Clamp(step, 0, this.stepMultipliers.Length - 1)];
}

private float GetCrashChanceForStep(int step)
{
    double stepMultiplier  = this.GetStepMultiplier(step);
    double stepMultiplier2 = this.GetStepMultiplier(step + 1);
    double num  = base.EstimatedValue / stepMultiplier;
    double num2 = base.EstimatedValue / stepMultiplier2 / num;
    return Mathf.Clamp01((float)(1.0 - num2));
}
```

`stepMultipliers = [1.0, 1.2, 1.5, 2.0, 3.0, 5.0, 10.0, 25.0, 75.0, 250.0, 1000.0]`.

### Matching math

Write $M(s)$ for `stepMultipliers[s]`. In `GetCrashChanceForStep`, the $E$ cancels:

$$\texttt{num2} = \frac{E / M(s{+}1)}{E / M(s)} = \frac{M(s)}{M(s{+}1)}
\qquad\Longrightarrow\qquad
P(\text{survive } s) = 1 - P(\text{crash } s) = \frac{M(s)}{M(s{+}1)}$$

Reaching step $n$ means surviving steps $0 \ldots n-1$, a **telescoping product**:

$$P(\text{reach } n) = \prod_{s=0}^{n-1}\frac{M(s)}{M(s{+}1)} = \frac{M(0)}{M(n)}$$

The shown multiplier is the raw table value $M(n)$ (note: **not** scaled by $E$), so:

$$\text{EV} = P(\text{reach } n)\cdot M(n) = \frac{M(0)}{M(n)}\cdot M(n) = M(0) = 1.0$$

This is the one game where $E$ has **no effect at all**: it cancels inside the crash
formula and never multiplies the payout.

---

## 3. Minesweeper (`Minesweeper.cs`)

### Multiplier

```csharp
private double CalculateCurrentMultiplier()
{
    if (this._revealedTiles.Count == 0) return 1.0;
    int count = this.tiles.Count;                 // T = 25
    double num = 1.0;
    int num2 = count - this._currentMineCount;    // S = T - M (safe tiles)
    for (int i = 0; i < this._revealedTiles.Count; i++)
    {
        double num3 = (double)(num2 - i) / (double)(count - i);  // (S-i)/(T-i)
        num *= 1.0 / num3;
    }
    return num * base.EstimatedValue;
}
```

### Matching math

With $T$ total tiles, $M$ mines, $S = T - M$ safe tiles, after $r$ safe reveals.
The loop variable `num3` at iteration $i$ is the conditional survival probability of
the $i$-th reveal (sampling without replacement):

$$P(\text{survive } r) = \prod_{i=0}^{r-1}\frac{S-i}{T-i}
\;\left(= \frac{\binom{S}{r}}{\binom{T}{r}}\right)$$

The code accumulates the reciprocal of each factor, then scales by $E$:

$$M(r) = E\prod_{i=0}^{r-1}\frac{T-i}{S-i} = \frac{E}{P(\text{survive } r)}$$

$$\text{EV} = P(\text{survive } r)\cdot M(r) = E \;\xrightarrow{\;E=1\;}\; 1$$

Worked check ($M=3$ mines, $S=22$, reveal $r=3$):

$$P = \tfrac{22}{25}\cdot\tfrac{21}{24}\cdot\tfrac{20}{23} = 0.6678,\quad
M = \tfrac{25}{22}\cdot\tfrac{24}{21}\cdot\tfrac{23}{20} = 1.4975,\quad
P\cdot M = 1.000$$

---

## 4. Dragon Tower (`DragonTower.cs`)

### Egg placement and multiplier

```csharp
private void SetEggs()
{
    Random seededRandom = base.GetSeededRandom(0);
    foreach (DragonTower.Floor floor in this.floors)
        floor.eggIndex = seededRandom.Next(0, 4);   // 1 bomb of 4 buttons
}

private double GetMultiplier(int stage)
{
    if (stage <= 0) return 1.0;
    double num = Math.Pow(0.75, (double)stage);
    return 1.0 / num * base.EstimatedValue;
}
```

### Matching math

Each floor hides 1 egg among 4 buttons, so a safe pick has probability
$\tfrac{3}{4} = 0.75$. To stand on floor $s$ you must have picked safely $s$ times:

$$P(\text{reach } s) = \left(\tfrac{3}{4}\right)^{s} = 0.75^{\,s}$$

`GetMultiplier` returns exactly the reciprocal of that, scaled by $E$:

$$M(s) = \frac{E}{0.75^{\,s}} = E\left(\tfrac{4}{3}\right)^{s}$$

$$\text{EV} = P(\text{reach } s)\cdot M(s)
= \left(\tfrac{3}{4}\right)^{s} E\left(\tfrac{4}{3}\right)^{s} = E
\;\xrightarrow{\;E=1\;}\; 1$$

With 6 floors the max multiplier is $\left(\tfrac{4}{3}\right)^{6} \approx 5.62\times$.

---

## Summary

| Game | Code multiplier | $P$ | $M$ | EV |
|------|-----------------|-----|-----|----|
| Hi-Lo | `E / num` | $1-t$ or $t$ | $E/P$ | $E$ |
| Penguins | `stepMultipliers[n]` | $M(0)/M(n)$ | $M(n)$ | $M(0)=1$ |
| Minesweeper | `prod(1/((S-i)/(T-i))) * E` | $\prod\frac{S-i}{T-i}$ | $E/P$ | $E$ |
| Dragon Tower | `1/0.75^s * E` | $0.75^{\,s}$ | $E/0.75^{\,s}$ | $E$ |

All four are $M = E/P$ in spirit (Penguins just bakes $E$ out via its crash formula
and uses a fixed table). With the shipped $E = 1.0$ every one is exactly 100% RTP,
but only Penguins is *structurally* immune to the profitability slider.
