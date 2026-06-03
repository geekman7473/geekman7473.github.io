---
title: "Reverse engineering every game in Gamble With Your Friends"
date: 2026-05-30
summary: ""
math: true
---

# *TL;DR:*

I decompiled *Gamble With Your Friends* to work out the odds of every minigame in the casino. The table below shows the games by approximate edge, sorted by ["Return To Player" (RTP)](https://en.wikipedia.org/wiki/Return_to_player). Bigger RTP means the player has better odds. 100% here means essentially "perfectly fair 50/50 odds".

| Game | Bet | RTP | Favors |
|------|-----|----:|:------:|
| Craps | Pass line | 137.75% | Player |
| Money Wheel | Orange | 135.10% | Player |
| Ducks | Jabin | ~134.80% | Player |
| Video Poker | Strategy Table | 128.10% | Player |
| Slots | N/A | ~115.70% | Player |
| Ducks | Yarl | ~109.50% | Player |
| Money Wheel | Red | 108.10% | Player |
| Blackjack | Strategy Table | ~102.00% | Player |
| Coin Flip | Heads / Tails | 100.00% | Fair |
| Penguins | Any step | 100.00% | Fair |
| Prize Wheel | Any segment | 100.00% | Fair |
| Hi-Lo | Any threshold | 100.00% | Fair |
| Dragon Tower | Any difficulty | 100.00% | Fair |
| Keno | Any pick count | 100.00% | Fair |
| Minesweeper | Any mine count | 100.00% | Fair |
| Roulette | Any bet | 97.30% | House |
| Baccarat | Player / Banker | 90.10% | House |
| Crash | Any cashout | 85.00% | House |
| Ducks | Erlaf | ~81.40% | House |
| Money Wheel | Blue | 81.10% | House |
| Baccarat | Tie | 79.20% | House |
| Plinko | Single Ball | 78.50% | House |
| Money Wheel | Green | 75.70% | House |
| Ducks | Faruk | ~74.30% | House |


# Contents

- [Why I did this](#why-i-did-this)
  - [Caveats](#caveats)
  - [AI disclaimer](#ai-disclaimer)
- [Ducks](#ducks)
- [Slots](#slots)
- [Craps](#craps)
- [Prize wheels](#prize-wheels)
  - [Wheel of Fortune](#wheel-of-fortune)
  - [Money Wheel](#money-wheel)
- [Roulette](#roulette)
  - [The Martingales](#the-martingales)
  - [Crash](#crash)
- [Physics-driven games](#physics-driven-games)
  - [Coin Flip](#coin-flip)
  - [Plinko](#plinko)
- [Card games](#card-games)
  - [Blackjack](#blackjack)
  - [Video Poker](#video-poker)
  - [Baccarat](#baccarat)
- [Conclusion](#conclusion)


# Why I did this

<!-- TODO: hero image of the casino exterior in-game. Run scripts/prepare-post-image.ps1. -->

[*Gamble with your Friends*](https://store.steampowered.com/app/3892270/Gamble_With_Your_Friends/) is the latest entry in a sub-genre of indie titles that has become known as [Friendslop](https://en.wikipedia.org/wiki/Friendslop). While I don't agree with how pejorative this name is, I won't deny that it is a product of our current moment. *Gamble with your Friends* (GWYF) pits you, and up to five of your degen friends, against violent loan sharks to whom you owe an immense debt.

We had a lot of fun playing this game, we it made us wonder: are these games fair? While playing we got the distinct feeling that some of the games seemed to favor the player such as the slots and the ducks, while other games seemed unwinnable, like Crash. I was curious if the developers had juiced the odds one way or another. Fortunately, GWYF is a Unity game, and it does not ship itself AOT compiled. In simple terms, that means we can use reverse engineering tools like [dnSpy](https://github.com/dnspy/dnspy) to recover the game logic.

What this document is not intending to do is show you exploits. This post is only about statistics and odds. For example there is a [known exploit](https://steamcommunity.com/sharedfiles/filedetails/?id=3722573782) for Craps by crouching in a specific location before throwing the dice. Likewise, it is possible to [exploit](https://www.reddit.com/r/gamblewithyourfriends/comments/1t7hnwa/so_we_screwed_plinko_over/) 
Plinko by shoving baseball bats into the machine to form "ramps" for the balls to ride. I'm sure there are more exploits like this that are possible, but we are not interested in them here.

## Caveats

I did all of this analysis based on game build 1.0.11. If the game has updated since then it is possible that the developers have retuned the games to change their RTP entirely. In my analysis I found that there is a single tunable "profitability" slider that the devs can easily change at a later date in response to player feedback. Take these results with a grain of salt.

## AI disclaimer

I used AI assistance to aid in reverse engineering the game and to write various helper script. The analysis itself, and the prose you are reading are 100% human made, however many of the diagrams, charts, and tables in this post were constructed with AI assistance.

# Ducks

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/ducks.jpg' | relative_url }}"
       alt="The Duck Race game in Gamble With Your Friends, four lanes of ducks racing to a finish line"
       width="1600" height="900"
       loading="lazy" />
</figure>

Everyone loves the ducks so let's start there. On first glance, this game appears to be likely fair. When the race starts time starts ticking forward, and on every tick all of the ducks advance forward by uniformly sampled random amount.

```csharp
private IEnumerator DuckRaceRoutine(Random rng)
{
    this.RpcSetRunningAnimation(true);
    while (!this.duckRace.hasEnded)
    {
        float num = Mathf.Lerp(this.minStepDistance, this.maxStepDistance, (float)rng.NextDouble());
        float targetZ = Mathf.Min(base.transform.localPosition.z + num, this.duckRace.endPoint.localPosition.z);
        this.RpcStep(targetZ);
        yield return new WaitForSeconds(this.stepTweenDuration);
        if (Mathf.Approximately(targetZ, this.duckRace.endPoint.localPosition.z))
        {
            if (this.duckRace.OnDuckFinish(this))
            {
                this.RpcWinFeedback();
            }
            this.RpcSetRunningAnimation(false);
            yield break;
        }
        float seconds = Mathf.Lerp(this.minStepDelay, this.maxStepDelay, (float)rng.NextDouble());
        yield return new WaitForSeconds(seconds);
    }
    this.RpcSetRunningAnimation(false);
    yield break;
}
```

At first glance this looks perfectly symmetric. Every duck identical and independently seeded, so you would expect each one to cross first exactly one quarter of the time, paying a fair 4x:

$$E[\text{net}] = \tfrac{1}{4}(+3) + \tfrac{3}{4}(-1) = 0 \implies \text{RTP} = 100\%$$

This is what the math tells us, but when we dig deeper we find a big flaw: It turns out that multiple ducks can cross the finish line on the same tick. When this happens, the winner is determined by which Duck coroutine (which is basically like a thread) fires first. It turns out that Unity schedules these coroutines in creation order. The coroutines are started in index order, meaning that the ducks on the left side of the board are more likely to win.

I have to come clean here, I did not figure out this bug on my own. I was assisted by AI, which suggested this was possible. I didn't believe the AI, so I had it write a simple Unity program to simulate these dynamics as close as possible to what the game logic does. I simulated 4,000 duck races, so random variation should be minimal:

| Duck | Lane | Win % | RTP |
|------|:------------:|------:|------------------------------:|
| Jabin | 1 | 33.7% | 135% |
| Yarl | 2  | 27.4% | 110% |
| Erlaf | 3  | 20.4% | 81% |
| Faruk | 4 | 18.6% | 74% |

Jabin (lane 1) wins nearly **twice as often** as Faruk (lane 4). The chi-square against a uniform 25% split is 231, where anything above 7.815 already rejects "all ducks equally likely" at the 95% confidence level. This is largely because the track they race on is relatively short. If they were on a longer track, ties would be less likely, and this effect becomes less relevant:


| Track (steps) | Jabin | Yarl | Erlaf | Faruk | Chi-square |
|--------------:|-------:|-------:|-------:|-------:|-----------:|
| ~21 (in game) | 33.7% | 27.4% | 20.4% | 18.6% | 231 |
| 80 | 30.2% | 26.2% | 23.0% | 20.6% | 84 |
| 160 | 28.4% | 26.2% | 24.1% | 21.3% | 45 |


With this bug, the RTP of betting on Jabin is an eye watering **135%**. I suspect that the developers did not realize the implications of their tie breaking behavior. I hardly blame them, on first glance I also was ready to just write this off as "perfectly fair." Of course the correct way to fix this problem would be to use a fair tie-breaker, instead of biasing to certain ducks.

One caveat of this result is that while I did simulate the races inside of a toy Unity game, I did not run this same experiment in the original game itself. It is possible that would change the results. Future work here would require writing a GWYF mod to run the experiments in the game directly.

# Slots

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/slots.jpg' | relative_url }}"
       alt="The Mummy's Chamber slot machines in Gamble With Your Friends"
       width="1600" height="900"
       loading="lazy" />
</figure>

In real life, slot machines are tuned to be very close to 100% RTP. Some machines advertise 99% RTP, for example. Since modern digital slots need less maintanence than their mechanical predecesors, nor do they require a dealer, these are the money printers for casinos. At 99% RTP most players will not be able to discern that they are losing money on net, even though they slowly are being drained.

What we had noticed while playing the game was that playing the slots *felt* like it was slightly positive [EV](https://en.wikipedia.org/wiki/Expected_value). We had managed to rescue more than one run by spamming slot machines. Unlike the duck race above, this game is not very interesting from a technical perpsective. On each cell of the 3x3 grid, there is a "roller" which can display one of four symbols. Looking at the game code, these rollers seem unbiased, so all of the rollers are equally likely. It basically does this:

```python
def spinSlotMachine(playfield):
    for roller in playfield:
        roller.symbol = random.randint(1, 4)
```

You win when these rollers all contain the same symbol. The payout for various patterns is listed below, as extracted from game assets:

| Payline | Payout | Win Probability | EV |
|---|--:|--:|--:|
| Top row | 2x | 6.25% | 0.125 |
| Middle row | 2x | 6.25% | 0.125 |
| Bottom row |  2x | 6.25% | 0.125 |
| Left column |  2x | 6.25% | 0.125 |
| Middle column |  2x | 6.25% | 0.125 |
| Right column |  2x | 6.25% | 0.125 |
| Diagonal ＼ |  2x | 6.25% | 0.125 |
| Diagonal ／ |  2x | 6.25% | 0.125 |
| Diamond | 5x | 1.5625% | 0.078 |
| X (corners + center) | 20x | 0.390625% | 0.078 |
| Full board | 59x | 0.001526% | 0.0009 |

Summing that column gives the base RTP:

$$E[\text{return}] = 8(0.125) + 0.078 + 0.078 + 0.0009 \approx \mathbf{1.157}$$

Additionally, the win is scaled by which of the four symbols you matched with.

| Symbol | Index | Factor |
|--------|:-----:|:------:|
| Lotus | 0 | 1.75x |
| Beetle | 1 | 1.25x |
| Staff | 2 | 0.75x |
| Eye | 3 | 0.25x |

Since these scaling factors average to 1.0 our EV is still **1.157.**

# Craps

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/craps.jpg' | relative_url }}"
       alt="The Street Craps table in Gamble With Your Friends with dice on the green felt"
       width="1600" height="900"
       loading="lazy" />
</figure>

As we mentioned before, craps is [exploitable](https://steamcommunity.com/sharedfiles/filedetails/?id=3722573782) but let's focus instead of playing the game correctly. When you toss the dice to scramble it, that action is random, and not weighted. When you throw the dice, they become physics objects and are simulated using Unity's physics engine. While we could in principle simulate these rolls, there is extra randomness introduced by player input since the starting velocity of the die is influenced by the players position and mouse cursor when they roll.

Instead, let's just do some classic statistics here. The first, "come-out", roll works like real craps: a 7 or 11 wins immediately paying out 2x. A 2, 3, or 12 loses immediately. Any other roll sets a target score, called a "point", that you need to attempt to roll for. If you hit your point you get paid out 4x, but if you instead roll a 7 you lose. Where this game differs from traditional casino craps is that after 3 attempts to hit your point, you get your ante refunded. In a normal casino you lose at this point, and this difference is why the player has an edge in GWYF's variant.

It is worth briefly reminding ourselves of the probabilities of the outcomes of rolling two dice:

<style>
.dice-hist{--tile:1.5rem;display:flex;align-items:flex-end;justify-content:center;gap:.35rem;border:2px solid #000;background:#fff;padding:1rem .5rem .4rem;overflow-x:auto;font-family:"Courier New",monospace}
.dice-hist .col{display:flex;flex-direction:column;align-items:center;flex:0 0 auto}
.dice-hist .stack{display:flex;flex-direction:column-reverse;align-items:center;line-height:1}
.dice-hist .stack span{font-size:var(--tile);letter-spacing:-.1em;white-space:nowrap;color:#000}
.dice-hist .axis{margin-top:.35rem;padding-top:.25rem;border-top:2px solid #000;width:100%;text-align:center;font-weight:bold;color:#000}
.dice-hist .ways{font-size:.7rem;color:#000}
</style>
<figure>
<div class="dice-hist" role="img" aria-label="Histogram of two-dice sums; each tile is one of the 36 equally likely combinations, peaking at 6 combinations for a sum of 7.">
  <div class="col"><div class="stack"><span>⚀⚀</span></div><div class="axis">2<div class="ways">1/36</div></div></div>
  <div class="col"><div class="stack"><span>⚀⚁</span><span>⚁⚀</span></div><div class="axis">3<div class="ways">2/36</div></div></div>
  <div class="col"><div class="stack"><span>⚀⚂</span><span>⚁⚁</span><span>⚂⚀</span></div><div class="axis">4<div class="ways">3/36</div></div></div>
  <div class="col"><div class="stack"><span>⚀⚃</span><span>⚁⚂</span><span>⚂⚁</span><span>⚃⚀</span></div><div class="axis">5<div class="ways">4/36</div></div></div>
  <div class="col"><div class="stack"><span>⚀⚄</span><span>⚁⚃</span><span>⚂⚂</span><span>⚃⚁</span><span>⚄⚀</span></div><div class="axis">6<div class="ways">5/36</div></div></div>
  <div class="col"><div class="stack"><span>⚀⚅</span><span>⚁⚄</span><span>⚂⚃</span><span>⚃⚂</span><span>⚄⚁</span><span>⚅⚀</span></div><div class="axis">7<div class="ways">6/36</div></div></div>
  <div class="col"><div class="stack"><span>⚁⚅</span><span>⚂⚄</span><span>⚃⚃</span><span>⚄⚂</span><span>⚅⚁</span></div><div class="axis">8<div class="ways">5/36</div></div></div>
  <div class="col"><div class="stack"><span>⚂⚅</span><span>⚃⚄</span><span>⚄⚃</span><span>⚅⚂</span></div><div class="axis">9<div class="ways">4/36</div></div></div>
  <div class="col"><div class="stack"><span>⚃⚅</span><span>⚄⚄</span><span>⚅⚃</span></div><div class="axis">10<div class="ways">3/36</div></div></div>
  <div class="col"><div class="stack"><span>⚄⚅</span><span>⚅⚄</span></div><div class="axis">11<div class="ways">2/36</div></div></div>
  <div class="col"><div class="stack"><span>⚅⚅</span></div><div class="axis">12<div class="ways">1/36</div></div></div>
</div>
</figure>

Each "tower" of dice in this diagram represents all of the possible rolls of two dice, and what value they sum to. This makes it a bit more intuitive that 7 is the most likely dice roll, and why. From here, we just need to consider the game as a sort of flow chart of dice rolls.

In the graph below we show what the rules say you do in the case of every dice roll, and that nodes contribution to EV. To make it explicit, EV is just "probability x reward".

<link rel="stylesheet" href="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/craps-flow.css' | relative_url }}">
<div class="craps-flow" id="craps-flow"></div>
<script src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/craps-flow.js' | relative_url }}" defer></script>

This diagram makes the math much more intuitive to me, since to calculate the EV we need to just traverse this whole decision tree. We can then construct a simplified table like this to see the overall EV contribution of each node:

| Outcome | Probability | Multiplier | EV contribution |
|---------|------------:|:----------:|----------------:|
| Come-out 7 / 11 | 22.22% | 2x | 0.4444 |
| Come-out 2 / 3 / 12 | 11.11% | 0x | 0.0000 |
| Point hit (within 3 rolls) | 17.15% | 4x | 0.6860 |
| Seven-out | 24.81% | 0x | 0.0000 |
| 3-roll refund | 24.71% | 1x | 0.2471 |
| **Total** | **100%** | | **1.3775** |

This result was not intuitive to my group, since we felt like we were *always* losing at Craps, but the overal EV of **1.3775** is one of the best player edges in the casino.

# Prize wheels

There are three wheel based games in the casino, that are fundamentally the same game.

## Wheel of Fortune

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/prize-wheel.jpg' | relative_url }}"
       alt="The Prize Wheel in Gamble With Your Friends, a segmented wheel with a Spin button in the center"
       width="1600" height="900"
       loading="lazy" />
</figure>

The simplest of the three, this wheel has 20 segments that are equally likely. What is interesting is that the "spin" of the wheel is just for show. The result of the spin is predetermined, and then the wheel is simply animated towards the predetermined result:

```csharp
public virtual void SpinTheWheel(Random rng)
{
    if (this._isSpinning) return;
    this._isSpinning = true;

    // 1. Pick the resting position FIRST: a uniform angle in [0, 360).
    float angle = (float)(rng.NextDouble() * 360.0);
    // Add a few whole turns purely for show, so it looks like a real spin.
    float finalAngle = this.minTurnAmount * 360f + angle;
    if (this.spinDirection) finalAngle *= -1f;

    // 2. Animate toward that predetermined angle (DOTween, fixed easing).
    this.RpcSpinWheel(finalAngle, this.spinDuration);
    base.StartCoroutine(this.WaitAndStop());
}
```

Since the segments are all equal width, they are therefore equally likely. By adding up the multipliers on the wheel segments we can straightforwadly get the EV:

| Payout | Wedges | Probability | EV contribution |
|---------|:--------------:|------------:|----------------:|
| 5x | 1 | 5% | 0.250 |
| 3x | 2 | 10% | 0.300 |
| 2x | 2 | 10% | 0.200 |
| 0.5x | 3 | 15% | 0.075 |
| 0.25x | 4 | 20% | 0.050 |
| 0.1x | 5 | 25% | 0.025 |
| 0x | 1 | 5% | 0.000 |
| **Spin Again** | 2 | 10% | 0.100 |
| **Total** | **20** | **100%** | **1.000** |

The only subtle row is **Spin Again**. Since they spin the wheel for us a second time, they are equivalent to refunding us and us playing again, so we can count is as the same as a 1x payout. Summing the EV contributions we find that means this game has an EV of **1.0**, making it perfectly fair.

### Money Wheel

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/money-wheel.jpg' | relative_url }}"
       alt="The Money Wheel in Gamble With Your Friends, with 2X, 3X, 5X, and 10X color bets below the wheel"
       width="1600" height="900"
       loading="lazy" />
</figure>

The Money Wheel is governed by the same logic as the Wheel of Fortune, in that it also predetermines the result and then drives the animation towards it. What makes this game different is that it asks you to predict the outcome of the spin, Green, Blue, Red, or Orange. These colors payout at different rates, 2x, 3x, 5x, and 10x respectively. You may be tempted to think that surely this game will also be fair, but it *emphatically is not*.

Adding up the number of squares per color we get this:

| Color | Segments | Share of wheel | Payout | RTP (share × payout) |
|-------|:--------:|---------------:|-------:|---------------------:|
| Green | 14 | 14/37 = 37.84% | 2x | 75.68% |
| Blue | 10 | 10/37 = 27.03% | 3x | 81.08% |
| Red | 8 | 8/37 = 21.62% | 5x | 108.11% |
| Orange | 5 | 5/37 = 13.51% | 10x | 135.14% |

If you are playing this game, you should ONLY play Red or Orange bets, never Green or Blue.

# Roulette

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/roulette.jpg' | relative_url }}"
       alt="The roulette wheel and betting layout in Gamble With Your Friends"
       width="1600" height="900"
       loading="lazy" />
</figure>

Roulette is a textbook Casino style Roulette wheel, with a single green square. This game is very similar to the other two wheel games, and as such the ball landing on a square is simply animated towards a predetermined target. For this game we don't even need to do our own math, [Wikipedia has done it for us.](https://en.wikipedia.org/wiki/Roulette#House_edge) Regardless of your bet or betting patterns your RTP will be 97.30%, just like at a real casion.

## The Martingales
<style>
.game-gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:.5rem}
.game-gallery img{width:100%;height:auto;display:block;border:2px solid #808080}
@media (max-width:640px){.game-gallery{grid-template-columns:1fr}}
</style>
<figure>
  <div class="game-gallery">
    <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/hi-lo.jpg' | relative_url }}"
         alt="The Hi-Lo game in Gamble With Your Friends with the Under/Over slider set to 50%"
         width="1600" height="900" loading="lazy" />
    <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/penguins.jpg' | relative_url }}"
         alt="The Penguins Crossy Road style game in Gamble With Your Friends, an icy board with stepping lanes"
         width="1600" height="900" loading="lazy" />
    <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/minesweeper.jpg' | relative_url }}"
         alt="The Minesweeper Mines game in Gamble With Your Friends with a 3-mine grid mid-game"
         width="1600" height="900" loading="lazy" />
    <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/dragon-tower.jpg' | relative_url }}"
         alt="The Dragon Tower game in Gamble With Your Friends, a tall tower of tiles to climb"
         width="1600" height="900" loading="lazy" />
    <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/keno.jpg' | relative_url }}"
         alt="The Keno board in Gamble With Your Friends, a grid of tiles with a gem and the current multiplier"
         width="1600" height="900" loading="lazy" />
    <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/crash.jpg' | relative_url }}"
         alt="The Crash game in Gamble With Your Friends, with the multiplier curve climbing past 2x"
         width="1600" height="900" loading="lazy" />
  </div>
</figure>

Hi-Lo, Penguins, Minesweeper, Dragon Tower, Keno, and Crash look like six different games, but they are really the same game mathamatically. Each one secretly picks a survival probability $$P$$, lets you climb for a rising multiplier, and pays out exactly $$1/P$$ if you make it to where you stop. In short, the more risk you take on, the higher the payout, but weighted such that the EV is always 1.

$$E[\text{return}] = P \times \frac{1}{P} = 1 \implies \text{RTP} = 100\%$$

I think to make this more intuitive, it's helpful to start with Hi-Lo. If you set the slider in Hi-Lo to the 50% position, your odds of winning are exactly 50% regardless of if you pick "Hi" or "Low". Because your odds are 50% or $$1/2$$ the game pays out the reciprocal of your odds, which is 2x. Likewise, if you set the slider to the 90% position and bet "Hi" your odds of winning are $$1/10$$, so the game will payout 10x if you win.

```csharp
// HiLoGame.cs -- roll is uniform on [0, 1); hiLoSlider.currentValue is the threshold t
float roll = (float)base.GetSeededRandom(0).NextDouble();
bool win = this._isOver
    ? roll >= this.hiLoSlider.currentValue    // "Hi":  win when the roll clears t
    : roll <= this.hiLoSlider.currentValue;   // "Low": win when the roll is under t

// P(win) is exactly the slider position, and the multiplier is E / P(win)
double num = this._isOver
    ? (1.0 - (double)this.hiLoSlider.currentValue)   // P(win) for "Hi"
    : ((double)this.hiLoSlider.currentValue);        // P(win) for "Low"
double multiplier = 1 / num;
```

The other five games follow the same pattern. For example in Minesweeper your payout is calculated based on the number of mines you added to the board, and the number of tiles you have revealed so far. The math looks like this:

$$P(\text{survive } r) = \prod_{i=0}^{r-1} \frac{N - m - i}{N - i}$$

Where $$N$$ is the total tiles, $$m$$ is the number of mines, and $$r$$ is the number of tiles safely revealed.

```csharp
// Minesweeper.cs
private double CalculateCurrentMultiplier()
{
    if (this._revealedTiles.Count == 0) return 1.0;
    int count = this.tiles.Count;                 // N: total tiles (25)
    double num = 1.0;
    int num2 = count - this._currentMineCount;    // S: safe tiles = N - m
    for (int i = 0; i < this._revealedTiles.Count; i++)
    {
        // (S - i)/(N - i) is P(the i-th reveal is safe), sampling without replacement
        double num3 = (double)(num2 - i) / (double)(count - i);
        num *= 1.0 / num3;                         // accumulate 1 / P(survive so far)
    }
    return num;
}
```

The payout that the game gives you for winning is therefore $$1/P(\text{survive})$$ just like Hi-Lo. It turns out that games of this flavor are called "martingales". I won't pretend to understand all of the math here, but the [optional stopping theorem](https://en.wikipedia.org/wiki/Optional_stopping_theorem) proves that for games like this there is **no cash-out strategy that improves your expected value.** I won't bore you with going through these games one by one, but they all have this flavor to them, and are tuned to be exactly fair in the code with one notable exception.

### Crash

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/crash.jpg' | relative_url }}"
       alt="The Crash game in Gamble With Your Friends, with the multiplier curve climbing past 2x"
       width="1600" height="900"
       loading="lazy" />
</figure>

Crash is the only one of these martingale games that is not tuned to be fair. From the game code we see the following:

```csharp
Random seededRandom = base.GetSeededRandom(0);
float num = (float)seededRandom.NextDouble();
float crashPoint = 1.01f;
if (num > this.instantCrashChance)
{
    crashPoint = this.GetRandomCrashPoint((float)seededRandom.NextDouble());
}
...
private float GetRandomCrashPoint(float r)
{
    r = Mathf.Max(r, 0.001f);
    return Mathf.Clamp(1f / r, 1.001f, this.maxPoint);
}
```

Note the variable "instantCrashChance." Unlike the other games, Crash has a tunable paramater for how likely the player should be to lose instantly. "instantCrashChance" is set to 15% in the shipping version of the game. I presume this is to tune down the likelihood of the potentially enourmous wins that are possible here. It's hard to say exactly why this was done, but nether the less, this caps the EV for this game at **0.85**


# Physics-driven games

Two of the games in the casino are actually driven by the Unity physics engine. While we can reason about them analytically, that analysis might not match the real game logic for a number of reasons. 

## Coin Flip

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin-flip-win.jpg' | relative_url }}"
       alt="The winning side of the Coin Flip in Gamble With Your Friends, a green coin with a money symbol"
       width="1600" height="900"
       loading="lazy" />
</figure>

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin-flip-loss.jpg' | relative_url }}"
       alt="The losing side of the Coin Flip in Gamble With Your Friends, a red coin with X eyes"
       width="1600" height="900"
       loading="lazy" />
</figure>

Let's start with the very first game you are presented with when you start the game: the Coin Flip. If you aren't familiar with GWYF, if you win the coinflip you are allowed to play the game. If you fail, the game exits and you have to try again. It's a good teaser for the vibe of the rest of the game.

In the Unity scene that drives the coin flip, the coin starts face down. The game then applies a random upward force, and a torque along a random axis to the coin. The coin is simulated with the default Unity physics engine, but the physics constants have been tuned for a more dramatic looking coin flip. For example, normally in Unity gravity if 15 m/s², but the coin only experiences 2 m/s² of gravity.

Now every middle schooler can tell you that a coin flip is roughly 50-50, but even in real life [it is possible for coins to not be fair](https://en.wikipedia.org/wiki/Fair_coin). To this end, we will need to do the same trick we did with the duck game and simulate a couple thousand runs by recreating the game code as faithfully as we can in our own Unity scene.

| Flips | Win | Lose | P(win) | RTP |
| 10,000 | 4,995 | 5,005 | **0.4995** | **99.9%** |

This is a pretty good result, and shows that this coin is damn near fair. One fun caveat of these results is that "tails" and "heads" are not the only possibilities. It turns out that the coin is being flipped inside an invisible "cup" to prevent it from flying off screen. In some rare circumstances, it is possible for the coin to come to rest leaning on the walls of this cup. Likewise, under extreme circumstances it is possible for the coin to land precisely on it's edge. These quirks don't influence the outcome of the experiments much, they are just fun.

<style>
.coin-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.6rem;margin:1.2rem 0}
.coin-grid figure{margin:0;border:2px solid #808080;background:#000;display:flex;flex-direction:column}
.coin-grid video{width:100%;height:auto;aspect-ratio:9/16;display:block;background:#000;object-fit:cover}
.coin-grid figcaption{font-family:"Courier New",monospace;font-size:.7rem;line-height:1.35;padding:.35rem .45rem;color:#000;background:#c0c0c0;border-top:2px solid #808080}
.coin-grid figcaption b{display:block;font-size:.74rem}
@media (max-width:880px){.coin-grid{grid-template-columns:repeat(2,1fr)}}
.plinko-balls{display:block;width:100%;max-width:480px;height:auto;margin:0 auto;border:2px solid #808080;background:#000}
</style>
<div class="coin-grid" id="coin-grid">
  <figure><video muted loop playsinline preload="none" width="360" height="640" poster="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/heads-1.jpg' | relative_url }}" src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/heads-1.mp4' | relative_url }}"></video><figcaption><b>Heads · lose</b>F 4.95 · τ 6.53 · θ 5°</figcaption></figure>
  <figure><video muted loop playsinline preload="none" width="360" height="640" poster="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/heads-2.jpg' | relative_url }}" src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/heads-2.mp4' | relative_url }}"></video><figcaption><b>Heads · lose</b>F 4.93 · τ 6.44 · θ 133°</figcaption></figure>
  <figure><video muted loop playsinline preload="none" width="360" height="640" poster="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/heads-3.jpg' | relative_url }}" src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/heads-3.mp4' | relative_url }}"></video><figcaption><b>Heads · lose</b>F 4.21 · τ 7.89 · θ 117°</figcaption></figure>
  <figure><video muted loop playsinline preload="none" width="360" height="640" poster="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/heads-4.jpg' | relative_url }}" src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/heads-4.mp4' | relative_url }}"></video><figcaption><b>Heads · lose</b>F 4.77 · τ 5.31 · θ 191°</figcaption></figure>
  <figure><video muted loop playsinline preload="none" width="360" height="640" poster="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/tails-1.jpg' | relative_url }}" src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/tails-1.mp4' | relative_url }}"></video><figcaption><b>Tails · win</b>F 4.18 · τ 8.96 · θ 140°</figcaption></figure>
  <figure><video muted loop playsinline preload="none" width="360" height="640" poster="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/tails-2.jpg' | relative_url }}" src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/tails-2.mp4' | relative_url }}"></video><figcaption><b>Tails · win</b>F 4.33 · τ 6.78 · θ 315°</figcaption></figure>
  <figure><video muted loop playsinline preload="none" width="360" height="640" poster="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/tails-3.jpg' | relative_url }}" src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/tails-3.mp4' | relative_url }}"></video><figcaption><b>Tails · win</b>F 4.48 · τ 9.67 · θ 102°</figcaption></figure>
  <figure><video muted loop playsinline preload="none" width="360" height="640" poster="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/tails-4.jpg' | relative_url }}" src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/tails-4.mp4' | relative_url }}"></video><figcaption><b>Tails · win</b>F 4.61 · τ 6.78 · θ 174°</figcaption></figure>
  <figure><video muted loop playsinline preload="none" width="360" height="640" poster="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/edge-1.jpg' | relative_url }}" src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/edge-1.mp4' | relative_url }}"></video><figcaption><b>On edge</b>F 4.84 · τ 5.12 · θ 214°</figcaption></figure>
  <figure><video muted loop playsinline preload="none" width="360" height="640" poster="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/edge-2.jpg' | relative_url }}" src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/edge-2.mp4' | relative_url }}"></video><figcaption><b>On edge</b>F 4.95 · τ 6.36 · θ 338°</figcaption></figure>
  <figure><video muted loop playsinline preload="none" width="360" height="640" poster="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/edge-3.jpg' | relative_url }}" src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/edge-3.mp4' | relative_url }}"></video><figcaption><b>On edge</b>F 4.25 · τ 5.77 · θ 349°</figcaption></figure>
  <figure><video muted loop playsinline preload="none" width="360" height="640" poster="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/edge-4.jpg' | relative_url }}" src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/edge-4.mp4' | relative_url }}"></video><figcaption><b>On edge</b>F 4.62 · τ 9.66 · θ 258°</figcaption></figure>
  <figure><video muted loop playsinline preload="none" width="360" height="640" poster="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/wall-1.jpg' | relative_url }}" src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/wall-1.mp4' | relative_url }}"></video><figcaption><b>Wall lean</b>F 4.05 · τ 7.50 · θ 289°</figcaption></figure>
  <figure><video muted loop playsinline preload="none" width="360" height="640" poster="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/wall-2.jpg' | relative_url }}" src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/wall-2.mp4' | relative_url }}"></video><figcaption><b>Wall lean</b>F 4.62 · τ 8.08 · θ 43°</figcaption></figure>
  <figure><video muted loop playsinline preload="none" width="360" height="640" poster="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/wall-3.jpg' | relative_url }}" src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/wall-3.mp4' | relative_url }}"></video><figcaption><b>Wall lean</b>F 4.80 · τ 9.19 · θ 242°</figcaption></figure>
  <figure><video muted loop playsinline preload="none" width="360" height="640" poster="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/wall-4.jpg' | relative_url }}" src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/coin/wall-4.mp4' | relative_url }}"></video><figcaption><b>Wall lean</b>F 4.72 · τ 8.83 · θ 322°</figcaption></figure>
</div>
<script>
(function(){
  var grid = document.getElementById('coin-grid');
  if (!grid) return;
  var vids = Array.prototype.slice.call(grid.querySelectorAll('video'));
  if (!vids.length) return;

  // Every clip is the exact same length (295 frames @ 30fps). Drive them from a
  // single shared clock: let them play out, then restart all 16 together at the
  // seam. No mid-play seeking, so nothing jumps or stutters while looping.
  var lead = vids[0];
  var running = false, guardTimer = null, cycling = false;

  function play(v){
    var p = v.play();
    if (p && p.catch) p.catch(function(){});
  }

  // Restart the whole grid from frame 0 in lockstep.
  function restartAll(){
    if (cycling) return;          // ignore duplicate triggers near the seam
    cycling = true;
    vids.forEach(function(v){
      try { v.currentTime = 0; } catch (e) {}
      play(v);
    });
    armGuard();
    setTimeout(function(){ cycling = false; }, 300);
  }

  // Fallback in case the lead clip's 'ended' event is missed: fire a hair after
  // the clip's natural duration.
  function armGuard(){
    if (guardTimer) clearTimeout(guardTimer);
    var dur = (isFinite(lead.duration) && lead.duration > 0) ? lead.duration : 9.84;
    guardTimer = setTimeout(function(){ if (running) restartAll(); }, dur * 1000 + 120);
  }

  function onLeadEnded(){ if (running) restartAll(); }

  function start(){
    if (running) return;
    running = true;
    vids.forEach(function(v){
      if (v.preload === 'none') { v.preload = 'auto'; v.load(); }
      v.loop = false;             // we handle looping ourselves
      try { v.currentTime = 0; } catch (e) {}
      play(v);
    });
    armGuard();
  }

  function stop(){
    running = false;
    if (guardTimer) { clearTimeout(guardTimer); guardTimer = null; }
    vids.forEach(function(v){ v.pause(); });
  }

  lead.addEventListener('ended', onLeadEnded);

  if (!('IntersectionObserver' in window)) { start(); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting) start();
      else stop();
    });
  }, { threshold: 0 });
  io.observe(grid);
})();
</script>

## Plinko

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/plinko.jpg' | relative_url }}"
       alt="The Plinko machine in Gamble With Your Friends, a triangular peg board with multiplier buckets from 24x down to 0.2x"
       width="1600" height="900"
       loading="lazy" />
</figure>

Plinko is an interesting case, because on first glance it might appear impossible to model the probability directly. However, the Plinko machine is a straightforward application of the [binomial distribution](https://en.wikipedia.org/wiki/Binomial_distribution). In a simplified view of the Plinko machine, imagine that at each vertical level of the board the ball asks a question "should I go right, or should I go left?" and flips a coin to determine it's path. Assuming that the coin is fair, you should see probabilities like this:

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/plinko/plinko-galton-tree.svg' | relative_url }}"
       alt="Galton board probability tree for an 11-row Plinko machine; each node is labeled with the binomial probability of a ball reaching it"
       width="894" height="500"
       loading="lazy"
       style="width:100%;height:auto;border:2px solid #808080" />
</figure>

This type of model is also called a [Galton board](https://en.wikipedia.org/wiki/Galton_board). Notice on the third row that the probabilities for each node goes, from left to right, 25%, 50%, 25%. That is because there are 2 paths to reach the middle node, but there is only one path to reach the left and right paths. This simple idea, iterated out for all 11 rows, gets us our expected probabilities for each of the bottom nodes. Now reminding ourselves of the $$EV = probability * reward$$ math we can use this table to compute the "theoretical" EV of this game.

<div class="table-scroll" markdown="1">

| Bin | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|----:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|---:|---:|
| Mult | 24x | 6x | 2.8x | 1.2x | 0.5x | 0.2x | 0.2x | 0.5x | 1.2x | 2.8x | 6x | 24x |
| Probability | 0.05% | 0.54% | 2.69% | 8.06% | 16.11% | 22.56% | 22.56% | 16.11% | 8.06% | 2.69% | 0.54% | 0.05% |
| EV | 0.012 | 0.032 | 0.075 | 0.097 | 0.081 | 0.045 | 0.045 | 0.081 | 0.097 | 0.075 | 0.032 | 0.012 |

</div>

$$\begin{aligned}
\text{EV} &= 0.012 + 0.032 + 0.075 + 0.097 + 0.081 + 0.045 \\
&\quad + 0.045 + 0.081 + 0.097 + 0.075 + 0.032 + 0.012 \\
&= 0.683
\end{aligned}$$

You can also compute this directly with the binomial distribution formula like such, where $$m_k$$ is the payout multiplier for bucket $$k$$:

$$\text{EV} = \sum_{k=0}^{11}\frac{\binom{11}{k}}{2^{11}}\,m_k = \frac{1398.8}{2048} = 0.683$$

The naive model says **68.3% RTP** which is a good starting point, but is ultimately wrong. The balls in this game do not behave like an idealized Galton board. For one they are bouncy, which the idealized balls are not. Also, the game code has some tunings that manually changes the speed of any ball after a collision, presumably just for visual appeal. To really make sure that we capture the real odds, we need to rebuild the in-game Plinko board in Unity and simulate it. I ran 100,000 balls through the simulated board and got these results:

<div class="table-scroll" markdown="1">

| Bin mult | 24x | 6x | 2.8x | 1.2x | 0.5x | 0.2x | 0.2x | 0.5x | 1.2x | 2.8x | 6x | 24x |
|---------:|----:|---:|-----:|-----:|-----:|-----:|-----:|-----:|-----:|-----:|---:|----:|
| Measured P | 0.59% | 0.97% | 1.53% | 2.94% | 8.82% | 34.44% | 34.70% | 8.99% | 2.98% | 1.43% | 0.92% | 0.62% |

</div>

The twelve pockets account for 98.92% of drops; the remaining **1.08%** are balls that got stuck on one of the pegs. The game has a 20s timeout, after which the ball is deleted and the player loses. Doing the same math we did above, we get an EV of **0.78**, which is 10 points higher than our theoretical guess. Looking at a histogram of where the balls land, this becomes a bit more obvious:

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/plinko/plinko-histogram.png' | relative_url }}"
       alt="Bar chart comparing the binomial (Galton board) pocket probabilities against the measured PhysX simulation over 100,000 drops, showing much fatter 24x edges in the measured data"
       width="1575" height="840"
       loading="lazy" />
</figure>

Even though the center 0.2x bins are way more likely than the math predicted, which should drag our EV down, the 24x buckets on the edge are 10 times more likely than we predicted. These edge buckets account for the almost the entire EV improvement above the theoretical model.

<figure>
  <video class="plinko-balls" muted loop autoplay playsinline preload="metadata"
         width="640" height="640"
         poster="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/plinko/plinko-balls.jpg' | relative_url }}"
         src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/plinko/plinko-balls.mp4' | relative_url }}"></video>
    <figcaption>1,000 indepedent samples superimposed as a sample of the behavior of this system</figcaption>
</figure>

# Card games

The card-based games (Blackjack, Video Poker, Baccarat) all deal cards from an RNG seeded shoe containing a single deck. The shoe is not shuffled in-between rounds, until the deck is empty, so these games are all card countable. With that said, we will be treating these games as if you are not counting for simplicity.

## Blackjack

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/blackjack.jpg' | relative_url }}"
       alt="A blackjack hand in Gamble With Your Friends with Double, Stand, Hit, and Play buttons"
       width="1600" height="900"
       loading="lazy" />
  <figcaption class="meta">Blackjack, with the house rules bent toward the player: blackjack pays 2:1 and always beats the dealer. (May 2026)</figcaption>
</figure>

Blackjack in this casino bends the rules in the player's favor: natural blackjack pays 2:1 instead of the usual 3:2, a player blackjack always wins (even against a dealer blackjack), and the dealer stands on all 17s. One restriction cuts the other way: you cannot split. The decompiled code actually contains a complete split routine, but it is dead, there is no split button anywhere in the UI, so your only actions are hit, stand, and double. Due to these rule changes, the normal house edge of ~2% is in question. To determine both the house edge and the optimal play charts, we used [Eric Farmer's blackjack analyzer](https://github.com/possibly-wrong/blackjack), an engine that computes the optimal blackjack play for any given rule set.

| Result | Return | Net |
|--------|-------:|----:|
| Player blackjack | 3x | +2 |
| Player win | 2x | +1 |
| Push | 1x (refund) | 0 |
| Player lose | 0x | -1 |

The headline change is the 2:1 blackjack payoff, worth about +2.3% over the same game paying 3:2, which by itself is more than enough to flip the usual house edge into a player edge. A player natural also beating (rather than pushing) a dealer natural nudges it up a touch more.

### Computing the exact RTP

Farmer's engine natively expresses almost every rule this game uses: single deck, dealer stands on soft 17, double on any first two cards, no surrender, no splitting, and a configurable blackjack payoff. We point it at exactly those rules with the payoff set to 2:1 and read the overall expected value straight out of a single run, with no custom settlement math bolted on. Flipping the payoff back to the usual 3:2 is a handy sanity check: the engine lands at -0.333%, right where standard single-deck, no-split basic strategy should be.

| Rules | Blackjack payoff | Overall EV | RTP |
|-------|:----------------:|-----------:|----:|
| Single deck, S17, double any two, no split, no surrender | 3:2 | -0.333% | 99.667% |
| Single deck, S17, double any two, no split, no surrender | 2:1 | +1.991% | 101.991% |

$$\boxed{\textbf{RTP} \approx 102.0\%, \quad \textbf{Player edge} \approx +2.0\%}$$

The 2:1 blackjack payoff is doing all of the work here: on its own it swings the single-deck baseline from -0.333% up to +1.991%, turning a small house edge into a real player edge.

Two of the game's quirks fall outside what the engine can express: the dealer never peeks for blackjack (so a doubled wager is exposed to a dealer natural), and a player natural beats rather than pushes a dealer natural. These pull in opposite directions and are each only a few tenths of a percent, with the player-favorable one slightly larger, so the true edge sits a hair above the engine's +2.0%.

#### Optimal strategy

The analyzer's basic strategy chart is below. It is close to standard single-deck basic strategy, because the 2:1 payoff barely changes any hit, stand, or double decision. Since you cannot split, there are no pair rows: just play any pair as its hard or soft total.

<div class="bj-strategy-chart-embed" data-src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/bj-strategy-chart.html' | relative_url }}"></div>
<script>
(function () {
  var el = document.querySelector('.bj-strategy-chart-embed');
  if (!el) { return; }
  fetch(el.getAttribute('data-src'))
    .then(function (r) { return r.text(); })
    .then(function (html) { el.innerHTML = html; })
    .catch(function () {});
})();
</script>

To use the chart, find the row that matches your hand and read across to the column for the dealer's up card. The cell where they meet is the action you should take. Hard totals (no ace, or an ace that can only count as 1) are the "H" rows, and soft totals that contain a flexible ace are the "A," rows. Check the soft rows first: if you hold an ace counted as 11, use the matching soft row; otherwise fall back to the hard total. Because you cannot split, a pair is just read as its total, so a pair of 8s is a hard 16 and a pair of aces is a soft 12.

## Video Poker

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/video-poker.jpg' | relative_url }}"
       alt="The Video Poker machine in Gamble With Your Friends showing a five-card hand and a Play button"
       width="1600" height="900"
       loading="lazy" />
</figure>

Like Blackjack, Poker is also very different from most Casino incarnations of the game. In this game the Ace is always low, and pairs pay. Normal video poker machines will require face card pairs to pay out.

I'm going to be honest: for this game I surrended entirely to our AI overlords. All of the other analsys was driven by me, with AI doing the boring stuff. In this case I could not find a ready-made tool to simulate the odds of this game, since it uses a custom rule set. "No worries", said the LLM dejure, "I can just spit that out for you". It generated some of the densest C++ code I have ever seen. I tried to understand it, and failed. To that end, take these results with a grain of salt: the poker solver that the AI wrote says that with perfect play this game has an EV of **1.28**.

The solver enumerated all 2,598,960 possible five-card deals. Scan your dealt hand from the top of the table down and take the first action that matches what you are holding. The "avg return" column is the average payout (in multiples of your bet) you can expect from playing that situation optimally.

| Dealt hand | Frequency | Best action | Avg return |
|------------|----------:|-------------|-----------:|
| Straight flush | 0.0014% | Keep all five | 50.00x |
| Four of a kind | 0.0240% | Hold the four, draw 1 | 25.00x |
| Full house | 0.1441% | Keep all five | 9.00x |
| Flush | 0.1967% | Keep all five | 6.00x |
| Three of a kind | 2.1128% | Hold the three, draw 2 | 4.30x |
| Straight | 0.3532% | Keep all five | 4.00x |
| Two pair | 4.7539% | Hold both pairs, draw 1 | 2.60x |
| One pair | 42.26% | Hold the pair, draw 3 | 1.54x |
| Four to a flush (no pair) | 2.95% | Hold the four suited, draw 1 | 1.47x |
| Four to a straight (no pair) | 9.20% | Hold any 2 suited, else a high card, draw 3 | 0.75x |
| Nothing | 38.01% | Hold one high card (or 2-3 suited), draw the rest | 0.68x |

### Baccarat

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/baccarat.jpg' | relative_url }}"
       alt="The Baccarat table in Gamble With Your Friends with Banker, Tie, and Player bet buttons"
       width="1600" height="900"
       loading="lazy" />
</figure>

Baccarat in GWYF is a stripped-down version of the game: two cards are dealt to each side, the totals are compared mod 10, and the higher one wins. Because a single deck only has 1,624,350 possible two-card-each deals, we can just enumerate all of them and tally the results.

$$\binom{52}{2}\binom{50}{2} = 1{,}624{,}350$$


| Outcome | Probability | Bet payout | EV |
|---------|------------:|:----------:|----:|
| Player wins | 45.05% | 2x | 0.901 |
| Banker wins | 45.05% | 2x | 0.901 |
| Tie | 9.90% | 8x | 0.792 |

The Player and Banker win counts are identical, so the house edge on those bets is from ties pushing to a loss. If ties were refunded, this game would be perfectly fair.

# Conclusion

Thanks for reading this far! Not much else to say other than go buy Gamble With Your Friends if you haven't tried it yet, it's great fun :)
