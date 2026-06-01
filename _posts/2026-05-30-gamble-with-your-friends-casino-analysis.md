---
title: "Reverse engineering every game in Gamble With Your Friends"
date: 2026-05-30
summary: ""
math: true
---

## *TL;DR:*

I decompiled *Gamble With Your Friends* and worked out the real odds of every minigame in the casino. The table below shows the games by approximate edge, sorted by ["Return To Player" (RTP)](https://en.wikipedia.org/wiki/Return_to_player). Bigger RTP means the player has better odds. 100% here means essentially "perfectly fair 50/50 odds".

| Game | Bet | RTP | Favors |
|------|-----|----:|:------:|
| Ducks | Jabin | ~140.00% | Player |
| Craps | Pass line | 137.75% | Player |
| Money Wheel | Orange | 135.10% | Player |
| Video Poker | Strategy Table | 128.10% | Player |
| Slots | N/A | ~115.70% | Player |
| Money Wheel | Red | 108.10% | Player |
| Ducks | Yarl| ~103.20% | Player |
| Blackjack | Strategy Table | ~102.70% | Player |
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
| Ducks | Erlaf | ~83.20% | House |
| Money Wheel | Blue | 81.10% | House |
| Baccarat | Tie | 79.20% | House |
| Plinko | Single Ball | 78.50% | House |
| Money Wheel | Green | 75.70% | House |
| Ducks | Faruk | ~74.00% | House |


## Why I did this

<!-- TODO: hero image of the casino exterior in-game. Run scripts/prepare-post-image.ps1. -->

[*Gamble with your Friends*](https://store.steampowered.com/app/3892270/Gamble_With_Your_Friends/) is the latest entry in a sub-genre of indie titles that has become known as [Friendslop](https://en.wikipedia.org/wiki/Friendslop). While I don't agree with how pejorative this nomenclature is, I won't deny that it is catchy. *Gamble with your Friends* (GWYF) pits you, and up to 5 of your degen friends, against violent loan sharks to whom you owe an immense debt.

We had a lot of fun playing this game, but we had to wonder, are these games fair? While playing we got the distinct feeling that some of the games seemed to favor the player such as the slots and the ducks, while other games seemed unwinnable, like Crash. I was curious if the developers had juiced the odds one way or another. Fortunately, GWYF is a Unity game, and it does not ship itself AOT compiled. In simple terms, that means we can use reverse engineering tools like [dnSpy](https://github.com/dnspy/dnspy) to recover the game logic.

What this document is not intending to do is show you exploits. This post is really about statistics and odds. For example there is a [known exploit](https://steamcommunity.com/sharedfiles/filedetails/?id=3722573782) for Craps by crouching in a specific location before throwing the dice. Likewise, it is possible to [exploit](https://www.reddit.com/r/gamblewithyourfriends/comments/1t7hnwa/so_we_screwed_plinko_over/) 
Plinko by shoving baseball bats into the machine to form "ramps" for the balls to ride. I'm sure there are more exploits like this that are possible, but we are not interested in them here.

## Caveats

I did all of this analysis based on game build 1.0.11. If the game has updated since then it is possible that the developers have retuned the games to change their RTP entirely. In my analysis I found that there is a single tunable "profitability" slider that the devs can easily change at a later date in response to player feedback. Take these results with a grain of salt.

## AI disclaimer

I used AI assistance to aid in reverse engineering the game and to write various helper script. The analysis itself, and the prose you are reading are 100% human made, however many of the diagrams, charts, and tables in this post were constructed with AI assistance.

## Ducks

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

At first glance this looks perfectly symmetric. Every duck is mechanically identical and independently seeded, so you would expect each one to cross first exactly one quarter of the time, paying a fair 4x:

$$E[\text{net}] = \tfrac{1}{4}(+3) + \tfrac{3}{4}(-1) = 0 \implies \text{RTP} = 100\%$$

This is what the math tells us, but when we dig deeper we find a big flaw: how does the game resolve ties? It turns out that multiple ducks can cross the finish line on the same tick. When this happens, the winner is determined by which Duck coroutine (which is basically like a thread) fires first. It turns out that Unity schedules these coroutines in index order, which means that the ducks on the left side of the board are more likely to win.

I have to come clean here, I did not figure out this bug on my own. I was assisted by AI, which suggested this was possible. I didn't believe the AI, so I had it write a simple Unity program to simulate these dynamics as close as possible to what the game logic does.

| Duck | Lane | Win % | RTP |
|------|:------------:|------:|------------------------------:|
| Jabin | 1 | 35.0% | 140% |
| Yarl | 2  | 25.8% | 103% |
| Erlaf | 3  | 20.8% | 83% |
| Faruk | 4 | 18.5% | 74% |

Jabin (lane 1) wins nearly **twice as often** as Faruk (lane 4). The chi-square against a uniform 25/25/25/25 split is 1284, where anything above 7.815 already rejects "all ducks equally likely" at the 95% level. This outcome is becuase the track they race on is relatively short. If they were on a longer track, ties would be less likely, and this effect becomes less prevalent.


| Track (steps) | Jabin | Yarl | Erlaf | Faruk | Chi-square |
|--------------:|-------:|-------:|-------:|-------:|-----------:|
| ~21 (real) | 35.0% | 25.8% | 20.8% | 18.5% | 1284 |
| 40 | 31.7% | 25.8% | 22.1% | 20.4% | 599 |
| 80 | 28.5% | 26.3% | 23.8% | 21.4% | 229 |
| 160 | 28.3% | 25.8% | 24.3% | 21.7% | 183 |

Of course the correct way to fix this problem would be to use a fair tie-breaker, instead of biasing to certain ducks.

## Slots

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/slots.jpg' | relative_url }}"
       alt="The Mummy's Chamber slot machines in Gamble With Your Friends"
       width="1600" height="900"
       loading="lazy" />
</figure>

In real life, slot machines are tuned to be very close to 100% RTP. Some machines advertise 99% RTP, for example. Since modern digital slots need less maintanence than their mechanical elders (well I presume this is true), nor do they require a dealer, casinos treat these as their money makers. At 99% RTP most players will not be able to discern that they are losing money on net, even though they slowly are being drained.

What we had noticed while playing the game was that playing the slots *felt* like it was slightly positive [EV](https://en.wikipedia.org/wiki/Expected_value). We had managed to rescue more than one run by spamming slot machines. Unlike the duck race above, this game is not very interesting from a technical perpsective. On each cell of the 3x3 grid, there is a "roller" which can display one of four symbols. Looking at the game code, these rollers seem unbiased, so all of the rollers are equally likely. It basically does this:

```python
def spinSlotMachine(playfield):
    for roller in playfield:
        roller.symbol = random.randint(1, 4)
```

You win when these rollers all contain the same symbol. The payout for various patterns is listed below.

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

## Craps

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/craps.jpg' | relative_url }}"
       alt="The Street Craps table in Gamble With Your Friends with dice on the green felt"
       width="1600" height="900"
       loading="lazy" />
</figure>

As we mentioned before, craps is [exploitable](https://steamcommunity.com/sharedfiles/filedetails/?id=3722573782) but let's focus instead of playing the game "correctly". When you "toss" the dice to scramble it that action is random, and not weighted. When you throw the dice, they become physics objects and are simulated using Unity's physics engine. While we could in principle simulate these rolls, there is extra randomness introduced by player input since the starting velocity of the die is influenced by how the player is looking when they throw.

Let's just do some classic statistics here. The first, "come-out", roll works like real craps: a 7 or 11 wins immediately paying out 2x. A 2, 3, or 12 loses immediately. Any other roll sets a target score, called a "point", that you need to attempt to roll for. If you hit your point you get paid out 4x, but if you instead roll a 7 you lose. Where this game differs from traditional casino craps is that after 3 attempts to hit your point, you get your ante refunded. In a normal casino you lose at this point, and this difference is why the player has an edge in GWYF's variant.

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

## Prize wheels

There are two wheels in the casino and they are very different games dressed up to look the same.

### Wheel of Fortune

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/prize-wheel.jpg' | relative_url }}"
       alt="The Prize Wheel in Gamble With Your Friends, a segmented wheel with a Spin button in the center"
       width="1600" height="900"
       loading="lazy" />
</figure>

The simpler of the two, this wheel has 20 segments that are equally likely. What is interesting is that the "spin" of the wheel is just for show. The result of the spin is predetermined, and then the wheel is simply animated towards the predetermined result:

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

Since the segments are all equal width, they are therefore equally likely. By adding up the multipliers on the wheel segments (using their descrptive) we can straightforwadly get the EV:

| Segment | Wedges (of 20) | Probability | EV contribution |
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

The only subtle row is **Spin Again**. Since they spin the wheel for us a second time, they are equivalent to refunding us and us playing again. Overall that means this game has an EV of 1.0 making it perfectly fair.

### Money Wheel

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/money-wheel.jpg' | relative_url }}"
       alt="The Money Wheel in Gamble With Your Friends, with 2X, 3X, 5X, and 10X color bets below the wheel"
       width="1600" height="900"
       loading="lazy" />
</figure>

The Money Wheel is governed by the same logic as the Wheel of Fortune, in that it also predetermines the result and then drives the animation towards it. What makes this game different is that it asks you to predict the outcome of the spin, Green, Blue, Red, or Orange. These colors payout at different rates, 2x, 3x, 5x, and 10x respectively. You may be tempted to think that surely this game will also be fair, but *very much is not*.

Adding up the number of squares per color we get this:

| Color | Segments | Share of wheel | Payout | RTP (share × payout) |
|-------|:--------:|---------------:|-------:|---------------------:|
| Green | 14 | 14/37 = 37.84% | 2x | 75.68% |
| Blue | 10 | 10/37 = 27.03% | 3x | 81.08% |
| Red | 8 | 8/37 = 21.62% | 5x | 108.11% |
| Orange | 5 | 5/37 = 13.51% | 10x | 135.14% |

If you are playing this game, you should ONLY play Red or Orange bets, never Green or Blue.

## Roulette

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/roulette.jpg' | relative_url }}"
       alt="The roulette wheel and betting layout in Gamble With Your Friends"
       width="1600" height="900"
       loading="lazy" />
</figure>

Roulette is a textbook Casino style Roulette wheel, with a single green square. This game is very similar to the other two wheel games, and as such the ball landing on a square is simply animated towards a predetermined target. For this game we don't even need to do our own math, [Wikipedia has done it for us.](https://en.wikipedia.org/wiki/Roulette#House_edge) Regardless of your bet or betting patterns your RTP will be 97.30%, just like at a real casion.

## Provably fair ladders (and one impostor)

Crash, Hi-Lo, Penguins, Minesweeper, Keno, and Dragon Tower are mechanically the same game wearing six different costumes. Each one picks a survival probability, then pays out `1 / P(survive)` if you make it. That construction pins RTP to exactly 100% no matter how the player tunes the difficulty knob.

### Crash

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/crash.jpg' | relative_url }}"
       alt="The Crash game in Gamble With Your Friends, with the multiplier curve climbing past 2x"
       width="1600" height="900"
       loading="lazy" />
</figure>

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

### Hi-Lo

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/hi-lo.jpg' | relative_url }}"
       alt="The Hi-Lo game in Gamble With Your Friends with the Under/Over slider set to 50%"
       width="1600" height="900"
       loading="lazy" />
</figure>

Hi-Lo is another `1 / P(win)` game: pure 100% RTP regardless of where you set the threshold. Lorem ipsum dolor sit amet, consectetur adipiscing elit.

### Penguins (Crossy Road)

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/penguins.jpg' | relative_url }}"
       alt="The Penguins Crossy Road style game in Gamble With Your Friends, an icy board with stepping lanes"
       width="1600" height="900"
       loading="lazy" />
</figure>

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

### Minesweeper

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/minesweeper.jpg' | relative_url }}"
       alt="The Minesweeper Mines game in Gamble With Your Friends with a 3-mine grid mid-game"
       width="1600" height="900"
       loading="lazy" />
</figure>

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

### Keno

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/keno.jpg' | relative_url }}"
       alt="The Keno board in Gamble With Your Friends, a grid of tiles with a gem and the current multiplier"
       width="1600" height="900"
       loading="lazy" />
</figure>

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

### Dragon Tower

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/dragon-tower.jpg' | relative_url }}"
       alt="The Dragon Tower game in Gamble With Your Friends, a tall tower of tiles to climb"
       width="1600" height="900"
       loading="lazy" />
</figure>

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Physics-driven games

A couple of these "RNG" outcomes are actually being decided by the live Unity PhysX simulation rather than by a random number read out of a table. The coin flip and Plinko both fall into this bucket. The coin flip is also the very first game you play in *Gamble With Your Friends*.

### Coin Flip

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

> **TODO:** the coin flip analysis isn't done yet. I'm physically simulating it in a headless Unity rig the same way I did for Plinko, and the run hasn't finished. I'll fill this section in once the numbers settle. Working hypothesis is a clean 50/50.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

### Plinko

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/plinko.jpg' | relative_url }}"
       alt="The Plinko machine in Gamble With Your Friends, a triangular peg board with multiplier buckets from 24x down to 0.2x"
       width="1600" height="900"
       loading="lazy" />
  <figcaption class="meta">The Plinko machine. The multiplier buckets run from 24x at the edges down to 0.2x in the middle, and at 78.5% RTP the house keeps the difference. (May 2026)</figcaption>
</figure>

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

<!-- TODO: drop the Plinko histogram from tools/PlinkoSim into assets/img/posts/<slug>/. -->

## Card games

The card-based games (Blackjack, Video Poker, Baccarat) all deal from a shared seeded RNG shoe. Each one has its own optimal strategy, which I solved either combinatorially or by Monte Carlo. The RTPs below assume you play that optimal strategy. There is a much more interesting wrinkle at the end of this section, so stick around for it.

### Blackjack

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/blackjack.jpg' | relative_url }}"
       alt="A blackjack hand in Gamble With Your Friends with Double, Stand, Hit, and Play buttons"
       width="1600" height="900"
       loading="lazy" />
  <figcaption class="meta">Blackjack, with the house rules bent toward the player: blackjack pays 2:1 and always beats the dealer. (May 2026)</figcaption>
</figure>

Blackjack in this casino bends the rules in the player's favor: natural blackjack pays 2:1 instead of the usual 3:2, a player blackjack always wins (even against a dealer blackjack), and the dealer stands on all 17s. Basic strategy under these rules gives the player roughly a 2.7% edge. Lorem ipsum dolor sit amet, consectetur adipiscing elit.

<!-- TODO: embed the basic-strategy chart computed by tools/farmer_blackjack. -->

### Video Poker

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/video-poker.jpg' | relative_url }}"
       alt="The Video Poker machine in Gamble With Your Friends showing a five-card hand and a Play button"
       width="1600" height="900"
       loading="lazy" />
  <figcaption class="meta">Video Poker: make the best hand you can. An Ace-low deck and a generous paytable push optimal play to 128.1% RTP. (May 2026)</figcaption>
</figure>

Video Poker uses an Ace-low deck (no royals) and the paytable is wildly generous: any pair returns your stake, and a straight flush pays 50x. Solved combinatorially with `tools/poker_solver/solve_poker.cpp`, the optimal-strategy RTP is 128.10%. Lorem ipsum dolor sit amet, consectetur adipiscing elit.

<!-- TODO: paste the discard-decision table from tools/poker_solver/poker_strategy_result.txt. -->

### Baccarat

<figure>
  <img src="{{ '/assets/img/posts/2026-05-30-gamble-with-your-friends-casino-analysis/baccarat.jpg' | relative_url }}"
       alt="The Baccarat table in Gamble With Your Friends with Banker, Tie, and Player bet buttons"
       width="1600" height="900"
       loading="lazy" />
  <figcaption class="meta">Baccarat: bet Banker, Player, or Tie. The only card game in the building with a real house edge. (May 2026)</figcaption>
</figure>

Baccarat is the one card game in the building with a real house edge. The Player/Banker bets land at about 90.1% RTP and the Tie bet is much worse at 79.2%. The entire edge is funded by ties being pushed to losses on the main bets. Lorem ipsum dolor sit amet, consectetur adipiscing elit.

### The card-counting disclaimer

Here is the wrinkle. **Every card game above is card-countable**, because the deck is not shuffled between hands. The shoe is dealt down until it runs out, at which point the table resets. That means a player who is tracking the shoe can swing the edge on every one of these games well into player-favorable territory. Lorem ipsum dolor sit amet, consectetur adipiscing elit.

```csharp
// TODO: paste the deck/shoe snippet from decomp/Assembly-CSharp/Blackjack.cs
// (or wherever the shoe lives) showing that no reshuffle happens between hands
// and that the shoe is only re-created when it's exhausted.
```

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## On using AI for this

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
