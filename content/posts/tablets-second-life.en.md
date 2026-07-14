---
title: "The Second Life of a Tablet"
excerpt: "Most \"dead\" tablets aren't broken — they've just been abandoned by their software. Why reuse pays off, what an old tablet can still do, and the open-source operating systems that give it years more life."
author: "RevampIT Team"
category: "Sustainability"
tags:
  - sustainability
  - repair
  - open-source
  - tablets
  - e-waste
featuredImage: "/blog/tablets-hero.svg"
publishedAt: "2026-07-09"
published: true
---

It's always the same story. A five-year-old tablet, screen intact, battery still holding a charge, ends up in a drawer — or worse, in the bin. The reason is almost never a fault. It's "it won't update any more" or "an app stopped working." These aren't hardware deaths. They're artificial deaths, and they can be undone.

At RevampIT we see these devices every day. This post lays out why an old tablet is almost always worth more than its scrap value — technically, environmentally, and practically.

## The problem in numbers

In 2022 humanity generated a record **62 million tonnes** of electronic waste — enough to fill 1.55 million 40-tonne trucks, bumper-to-bumper around the equator. Only **22.3 percent** of it was formally collected and recycled. The rest was burned, buried, or shipped out of sight.

![Global e-waste 2010 to 2030: 34, 62 and a projected 82 million tonnes — only 22.3 percent of the 2022 total was recycled.](/blog/tablets-ewaste.svg)

*The green segment shows the share of 2022 e-waste actually recycled. The dashed bar is the UN's 2030 projection. Source: UN Global E-waste Monitor 2024.*

And the gap is widening: e-waste is growing **five times faster** than documented recycling. Tablets sit right in the blast radius — light, glued, sealed, and quietly declared "too old" the moment the manufacturer stops shipping updates.

## Why tablets "die" — and why it's usually an excuse

A tablet is a display, a battery, a radio, and a system-on-chip. None of those wear out under normal use in five years. What expires is the **manufacturer's willingness to maintain the software** — and that is a problem software can solve. The usual suspects:

- **Software end-of-life.** The maker stops shipping OS and security updates, often just three to five years after release. Apps then refuse to run on the old version — even though the chip is more than capable.
- **Locked bootloaders.** The device only accepts the vendor's (now-frozen) firmware. You can't rescue it yourself.
- **A tired battery.** A lithium cell holds roughly 80 percent of its capacity after about 800 charge cycles. That's a CHF 15 part, not a dead device.
- **Full storage, little RAM.** A bloated stock OS crawls — a lean Linux or a de-bloated Android build frees up gigabytes and megahertz again.

> The key point: almost no tablet in the drawer is broken. It was abandoned by its software. That's exactly where repair and free operating systems come in.

## The carbon maths

Here's the figure that flips everything. Apple's own environmental report for the iPad mini states a lifetime footprint of about **95 kg CO₂e**. Of that, **66 kg — roughly 69 percent — is spent before the device is ever switched on**: mining, refining, and manufacturing. Years of actual use account for only 21 kg.

![Breakdown of an iPad mini's 95 kg CO₂e footprint: 66 kg manufacturing, 21 kg use, 6 kg transport, 2 kg recycling.](/blog/tablets-co2.svg)

*Manufacturing (orange) 66 kg · Use (dark green) 21 kg · Transport (light green) 6 kg · Recycling (grey) 2 kg. The bulk of the emissions is "embodied" — locked in at the factory. Source: Apple iPad mini environmental report.*

That ratio is the whole argument for reuse. Recycling recovers a fraction of the materials — but pays the manufacturing emissions for the replacement all over again. **Keeping a device in service is the single highest-leverage climate action you can take with it.** Every extra year is a tablet that *isn't* manufactured.

## Give the old device a new job

Not every tablet needs a full OS transplant to stay useful. A device that's too slow to be your daily driver is often perfect as a *single-purpose appliance* — bolted to a wall, propped in a kitchen, or wired into your home. A few proven roles:

- **Smart-home wall panel.** Mounted by the door as an always-on dashboard for lights, heating, and cameras (with something like Home Assistant).
- **Digital photo and art frame.** A rotating gallery of family photos or open-source generative art in the hallway.
- **Kitchen and reading device.** A wipe-clean, fixed recipe screen, or a low-glare reader for books and PDFs.
- **Security and baby monitor.** Its front camera plus an app turns it into a Wi-Fi monitor for the door, garage, or crib.
- **Music and audio controller.** A permanent remote for the household speakers, or a dedicated streaming and podcast deck.
- **Learning and kids' device.** Locked to educational apps with no accounts attached — a low-stakes first computer.

**Why this helps the planet.** Each of these is a new device that never gets bought: an old tablet as a wall panel replaces a purchased smart-home display; a recipe screen replaces a new kitchen gadget. The carbon maths above applies directly — roughly two-thirds of a device's footprint is locked into its manufacture, and you avoid all of it when an existing tablet takes the job. At the same time, a device that would otherwise sit in a drawer or a bin stays in service for years — and out of that 77.7-percent waste stream. Little effort, double win: no new device and no e-waste.

**How to make one — and lock it into kiosk mode.** The path is short. Pick the role and put the tablet where there's power — most stay permanently plugged in, so a tired battery no longer matters. Optionally flash a lean, free OS (next section), especially if it's going online, and set up the one app it will show from now on. The decisive step is locking the device to exactly that app, so nobody wanders through menus or opens something else by accident — this is called **kiosk mode**. Android has *screen pinning* built in; for permanently mounted panels there are dedicated kiosk apps that pin the device even more strictly to a single web dashboard or app. On the iPad the same feature is called *Guided Access* (Settings → Accessibility) — exactly right for the kids' device or the last-supported-iPadOS tablet from earlier. Finally, put the device on a guest or IoT Wi-Fi and switch off any accounts and sensors it doesn't need. The result is a terminal that does exactly one thing, for years.

**Who wants one.** More people than you'd think. Households: smart-home panel, kids' learning device, recipe or photo screen. Cafés, shops, and clinics: menu and info boards (digital signage), sign-in and feedback terminals, queue and booking displays. Schools, libraries, and makerspaces: cheap, dedicated learning and info stations. Care and accessibility: a device locked to a single video-call or photo app is often more usable for older people or people who need support than a fully open tablet. For all of these, a refurbished tablet in kiosk mode is far cheaper — and far greener — than purpose-built kiosk hardware. These are exactly the devices RevampIT can refurbish from donations and pass on.

**Can it be fully open source?** On Android: yes, end to end. The base is a free OS like LineageOS or /e/OS (next section), the apps come from the open-source store *F-Droid*, the lockdown is handled by an open-source kiosk app (such as *Webview Kiosk* or *WallPanel*), and a dashboard is served by the equally open-source *Home Assistant*. No Google account, no tracking, no licence fees — ideal for associations, schools, and anyone who wants full control. Only the iPad is left out: its locked bootloader allows no free OS, so there it stays with *Guided Access* on the original iPadOS.

Many of these roles run best on a de-bloated, free operating system. That's where the real longevity comes from. So let's free the software.

## Free the software: open-source operating systems

When the manufacturer walks away, an independent community can keep the tablet current and secure for years — often **more** secure than the stock OS, because the tracking and bloat go too. Two families to know: **Android-based ROMs** keep full hardware and app compatibility while removing vendor lock-in. **True Linux distributions** go further, turning the tablet into a pocket PC — more freedom, more effort, patchier hardware support.

| System | Base | Best for | Effort |
| --- | --- | --- | --- |
| **LineageOS** | Android · AOSP | Widest device support, reliable daily driver | Low |
| **/e/OS** | Android · de-Googled | Privacy without giving up comfort | Low |
| **postmarketOS** | Linux · Alpine | A real Linux tablet, longest lifespan | High |
| **Ubuntu Touch** | Linux · UBports | Clean, phone-like Linux | Medium |

**LineageOS** is the best-known Android ROM: it restores years of security updates to hundreds of devices and keeps full app compatibility — the default starting point for most tablets. **/e/OS** is a fully de-Googled fork with its own app store and cloud, ideal for a hand-me-down or a kids' device. **postmarketOS** aims for a **ten-year lifecycle** on a mainline Linux kernel and boots hundreds of models — but "support" ranges from fully working to barely booting, so check your exact device first. **Ubuntu Touch** by UBports offers a clean, gesture-based interface and is very stable on the devices it covers.

> **Two honest caveats.** iPads are the hard case: Apple's locked bootloader generally blocks any other OS — an old iPad's best second life is a single-purpose appliance on its last supported iPadOS, or donation for parts. And **DivestOS**, once a popular hardened ROM for end-of-life devices, **shut down in December 2024** — if an old guide recommends it, reach for LineageOS, GrapheneOS, or CalyxOS instead.

## How a reflash actually goes

Installing a custom operating system follows the same arc on almost every Android tablet. It takes an afternoon, a USB cable, and a willingness to read your specific device's wiki page carefully. The broad strokes:

1. **Check compatibility first.** Find your exact model on the project's device wiki. If it isn't listed as supported, stop here — pick a different OS or a no-flash appliance job.
2. **Back up and unlock the bootloader.** Copy anything you care about off the device. Then enable Developer Options, turn on `OEM unlocking`, and unlock via `fastboot`. This wipes the device — expected.
3. **Flash a custom recovery.** Install a recovery environment such as `TWRP` or the ROM's own recovery. This is the tool that sideloads the new system.
4. **Install the OS (skip Google if you want).** Sideload the ROM package. On Android ROMs you can use microG instead of Google Play services — lighter and more private.
5. **Replace the battery while you're in there.** If runtime is poor, a fresh cell is the cheapest upgrade you'll ever do. Bring the device to a repair café if it's glued — that's exactly what we're for.

> **One risk, for honesty's sake:** flashing can, in rare cases, render a device unusable ("brick" it) and voids most warranties. On a five-year-old out-of-support device that's usually an easy trade — but if you're unsure, do it alongside someone who's done it before. That's what a repair community is for.

## When reuse is no longer possible

If a tablet is genuinely finished, it still doesn't belong in the bin: sealed batteries are a fire risk, and the materials are valuable. Bring it to RevampIT — we'll repair it for someone who needs it, harvest it for parts, or recycle it properly, the way the other 77.7 percent never was.

**Used computers repaired and rehomed — not landfilled.**

## Sources

- UNITAR & ITU — [Global E-waste Monitor 2024](https://ewastemonitor.info/the-global-e-waste-monitor-2024/) (62 Mt generated, 22.3% recycled, five-times growth gap, 82 Mt by 2030).
- Apple — [iPad mini environmental report](https://www.apple.com/environment/) (95 kg CO₂e lifetime; 66 kg / 69% from materials and manufacturing).
- [LineageOS](https://lineageos.org/), [/e/OS](https://e.foundation/), [postmarketOS](https://postmarketos.org/), [Ubuntu Touch (UBports)](https://ubports.com/) — official project sites.
