---
title: "How to throw a LAN party in 2026"
date: 2026-07-12
summary: ""
---

# *TL;DR*

Buy a cheap Gigabit switch and connect *all* of your players via ethernet. If possible, your players should be on Windows only. Crank the A/C the day before the event. Play older casual games, and avoid e-sports titles/modern AAA games. Bring lots of snacks, and plan your power needs ahead of time. Use Challonge for tournament brackets. For file sharing, consider using LANBucket.

# Intro

I have been throwing LAN parties, or attending them for over 15 years now. During that time, I have built up some tribal knowledge of what it takes to throw a succesfull LAN party. This guide assumes a couple of things:

- Your party is somewhere between 5 and 24 guests. Anything smaller is really just "casually hanging with the fellas" and anything larger gets into serious event planning territory.
- You are predominantly looking to play on PC. While I do like to mix in some console games occasionally, if you are looking for a guide on how to host an Xbox 360 LAN for example, you will need to look elsewhere.
- You are going to be hosting in a house or apartment, and *not* a rented event space. I have no experience with that, I have only ever hosted LANs at someone's house, in a basement, garage, etc.
- You are only going to be inviting friends, or friends of friends, and not members of the public. I have never been to a public LAN, and the advice I have might not apply if you are playing with strangers.

As a host your responsibility is to do your best to ensure everyone has a good time. What you don't want to be doing is running back and forth trying to fix problems on the day of. With a little bit of planning, you can eliminate many of the common pitfalls that home LAN parties face.

# Where to sit

I recommend folding tables. While dining tables can work, they have drawbacks. Most notably, they are often "nice" surfaces that you don't want to ding up or get duct tape on. Plastic folding tables are great, primarily because you don't care about them, and at the end of the party you can clean them off with the garden hose. Easy-peasy.

I have tried a number of configurations, but the setup I found the most fun was when all of the players could sit in a long line of tables like this: 

<figure>
  <img src="{{ '/assets/img/posts/2026-05-16-why-i-built-lanbucket/2026-03-recent.jpg' | relative_url }}"
       alt="A LAN party arranged ona  number of folding tables in a line"
       width="1600" height="1200"
       loading="lazy" />
  <figcaption class="meta">Here you can see the arrangement of the folding tables (March 2026)</figcaption>
</figure>

This setup promotes a more social group dynamic where everyone feels included in the festivities. Also having the two sides like this meant we could easily divide into two teams for games where screen peeking matters. Compare that setup to this one:

<figure>
  <img src="{{ '/assets/img/posts/2026-05-16-why-i-built-lanbucket/2025-03-party.jpg' | relative_url }}"
       alt="A LAN party split across two tables"
       width="1600" height="1200"
       loading="lazy" />
  <figcaption class="meta">The outerlying islands of the LAN empire (March 2025)</figcaption>
</figure>

In this layout these two players on the "overflow" table felt like they had been exiled from the festivities. I try to avoid this problem when possible. Admittedly, my living space is unusual, and most houses won't have a space big enough for all of your players to be setup linearly like this. An alternative layout is to have a handful of rows spaced out by a couple feet like this:

<figure>
  <img src="{{ '/assets/img/posts/2026-05-16-why-i-built-lanbucket/2023-03-party.jpg' | relative_url }}"
       alt="A LAN party setup in a basement"
       width="1600" height="1200"
       loading="lazy" />
  <figcaption class="meta">Rows of one or two tables (March 2023)</figcaption>
</figure>

This layout works better in rooms of certain shapes, but you end up creating a bunch of islands of socialization. You basically need a seating chart, like at a wedding reception, to figure out who will vibe well with who. It can work, but I don't like it as much.

For the actual seating, I reccomend folding chairs if you are in a larger group. Proper desk chairs are much more comfortable, but they take up a lot more space. They are also cumbersome to move around. Folding chairs are relatively inexpensive. At time of writing, this padded chair is available for ~$23/each at Costco (https://sameday.costco.com/store/costco/products/55609644-maxchief-metal-highback-padded-folding-chair-1-each). If you are on a budget, check Goodwill, or other thrift stores in your area. We have found folding chairs at these stores for $4/each before.

I find that at a standard 6 foot folding table, you can comfortably seat four players like so:

<figure>
  <div data-lan-table data-feet="6" data-laptops="1" style="width:100%; aspect-ratio:16/10;"></div>
  <figcaption class="meta">Four players at a standard 6-foot folding table</figcaption>
</figure>
<script type="module" src="{{ '/assets/js/posts/lan-table-scene.js' | relative_url }}"></script>

Or at an 8 foot folding table, you can seat six players, but only if most of the players are on laptops:

<figure>
  <div data-lan-table data-feet="8" data-laptops="4" style="width:100%; aspect-ratio:16/10;"></div>
  <figcaption class="meta">Six players at an 8-foot folding table</figcaption>
</figure>

Another advantage of folding tables, which you can see in this renderings above, is that you can route cables between the folding tables by leaving a gap between two adjacent tables. If you were using a larger wooden table you would need to drill holes in the middle of the table to get the same effect.

# Networking

This sounds like it should be complicated, but I assure you that it is not. If you are the LAN party type, then you have probably seen videos of extravegent networking setups from the likes of Linus Tech Tips, including multiple servers, expensive fiber optics, caching services, etc. You do not need any of this. All you need is an unmanaged gigabit ethernet switch with enough ports for all of your players. This equipment is very cheap these days. I reccomend this model from TRENDNet: [TEG-S17D](https://www.amazon.com/TRENDnet-TEG-S17D-Switching-Enclosure-Protection/dp/B09WGYKFSQ?th=1). At time of writing this costs $58. I cannot stress enough how important it is to buy a *"switch"* and not a *"hub"*. Hubs are cheaper, but also much slower. The best way to think of it is that a hub acts as if all of your players are sharing the speed of one ethernet cable, but a switch allows everyone to run at full speed. Also, I highly reccomend buying an unmanaged switch. Managed switches act more like routers in a way, since they will have a management portal (a website or an app), where you can change settings. If you are a beginner to all of this, you will not need the features of a managed switch, and could shoot yourself in the foot. At a LAN party I hosted in highschool I used some managed switches I bought at a yardsale without understanding what I was doing, and a couple hours in the network completely collapsed. Learn from my mistake, save yourself a couple bucks, and just buy an unmanaged switch.

In terms of setup, this is super easy. Plug the switch into power. Then plug an ethernet cable into each user's computer. Then plug one ethernet cable into your existing internet router / modem. Really nothing to it.

<figure>
  <img src="{{ '/assets/img/posts/2026-07-12-how-to-host-a-lanparty-2026/network-diagram.svg' | relative_url }}"
       alt="Network diagram: two player PCs connect by ethernet to a switch, the switch connects to the router, and the router connects to the internet"
       width="660" height="225"
       loading="lazy" />
  <figcaption class="meta">It should look something like this</figcaption>
</figure>

## What about WiFi?

Do whatever you can to avoid WiFi. While WiFi is convenient, it has lead to more headache over the years than it is worth. The trouble with WiFi is scalability. While your home network might perform just fine with you and your spouse (+ kids?) when you cram 16 players in one room, it can bog down. The fundamental problem is that WiFi works using ["time division multiplexing"](https://en.wikipedia.org/wiki/Time-division_multiplexing) which is a big scary word for "everyone takes their turn." Basically, on each WiFi channel, only one device can talk at once. For most uses this is still an acceptable tradeoff, but for low-latency gaming the performance cost can be severe. The other problem with WiFi is compatability. For reasons that are mysterious to me, I have seen lots of issues in games over the years where WiFi users couldn't connect to eachother, or WiFi users can connect to eachother but not ethernet users, or Wifi users can only connect to *some* subset of the other users. It's a debugging nightmare, and not what you want to be dealing with on the day of your party. Unfortunately, lots of laptops these days don't come with Ethernet jacks. For that reason, I keep a handful of USB-C and USB-A ethernet dongles on hand. These things are dirtcheap online, and they make lots of networking issues go away. Totally worth it.

## Is Gigabit enough?

For now, yes. The majority of machines in circulation right now only have Gigabit ethernet ports. While more and more enthusiast class machines are coming out with 2.5Gbps ports, I think that the cost to upgrade your switches to 2.5Gbps doesn't pencil out for most people. The only exceptions are if you are planning on having lots of modern machines at the party, or if you plan on doing lots of file sharing. More on that later. For my LAN parties, I did upgrade to 2.5Gbps [with this switch](https://www.amazon.com/TRENDnet-Unmanaged-TEG-S3160-Switching-Protection/dp/B0DZ4W9623?th=1), but I still don't think that it's worth it for most people. 

Additionally, it's also worth mentioning that 10Gbps hardware is not even close to being ready for mainstream consumers. I have read some horror stories of the compatability issues that others have had trying to get 10 Gig to work, not to mention that 10Gig hardware is extraodinarily expensive. Don't bother with 10Gig, atleast not for now.

## What ethernet cables do you use?

Since we are targetting 1Gbps I reccomend sticking with Cat5e. This is cheaper than Cat6, or Cat7, which is overkill for our needs. You can buy premade cables in bulk online for reasonable prices. This is also something that your players should bring themselves, but in my experience people always forget these so it's good to have some on hand.

If you are willing to try something new, I reccomend making your own cables. Pre-made ethernet cables cost a lot more, and making the cables yourself allows you to make custom length cables exactly fitting your needs. For example, if the party is going to be held in the basement, and your Internet modem is on the 2nd floor, it can be useful to cut your own 100 foot long ethernet cable yourself. If you want to do this, buy a bulk reel of cable [like this one, ](https://www.amazon.com/VIVO-Ethernet-Waterproof-Outdoor-CABLE-V011/dp/B00GYGNCPO) a crimping tool [like this one, ](https://www.amazon.com/Cable-Matters-Ethernet-Pass-Through-Connectors/dp/B0CH3TDJ4B) RJ-45 connectors [like these](https://www.amazon.com/W-NECTOUN-100-PACK-Connectors-Network-Stranded/dp/B092J2WBLS), and a cable testing tool [like this one](https://www.amazon.com/TESMEN-TLP-123A-Ethernet-Continuity-Maintenance/dp/B0GN84H22V). There are numerous guides online on how to make an Ethernet cable, so I won't bore you with the details here.

## Do I really need Internet access?

No, but it's much more convenient. While true LAN games exist, many modern games rely on cloud services, even to play private matches. Steam social services, and Discord are also nice to have, and only work online. There are other weird things you will notice if machines don't have Internet access. Some apps, like for controlling fancy gaming mice and keyboards, need to connect online at startup. Even if your Internet connection is slow, especially if you are splitting it 16 ways, it's still nice to have.

# Power

One of the worst things that can happen to your LAN party is popping a circuit breaker. On one occasion, I remember tripping a breaker at an event and in the aftermath the whole party lost momentum and everyone just went home. This is a real vibe killer and you want to avoid it.

The rule of thumb I use, which is very conservative admittedly is "no more than 4 desktops on one circuit". Since laptops use far less power, I go up to 6 on one circuit. Do you best to get the laptops and desktops to intermingle to spread out the load.

Now the annoying part is you have to figure out which power outlets in your home map to which circuit. This is a manual process, but you'll only have to do it once. This process is best done with a partner. Your partner will stand by the circuit breaker, and flip the breakers one by one. You will then run around the house trying to figure out which outlets are now dead. You can do this by plugging a lamp in, or by using a dedicated outlet tester [like this one.](https://www.homedepot.com/pep/Klein-Tools-Receptacle-Tester-RT110/206517828) This process is made much easier if you have walkie-talkies, or just stay on speaker phone, with whoever is helping you out. Once you determine which 


