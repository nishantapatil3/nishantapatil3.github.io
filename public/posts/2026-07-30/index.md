---
title: The Two-Byte Bug Behind Broken Apple Battery Levels on Ubuntu
date: 2026-07-30
---

There is a small moment that can make an otherwise polished desktop feel unfinished.

I connected an Apple Magic Keyboard and Magic Trackpad to my Ubuntu machine over Bluetooth. Pairing was easy. Typing worked. Scrolling and gestures worked. Then I opened the Power window.

The keyboard showed **0%** battery. The trackpad showed **4%**.

Both devices were almost fully charged.

This was not a critical bug. I could still use everything. But it was exactly the kind of paper cut that keeps Linux from feeling as seamless as a Mac for everyday use. I wanted to open the Power window, see the real battery levels, and move on.

So I followed the percentage all the way down the stack.

### The Power window was telling the truth

My first assumption was that GNOME was interpreting the values incorrectly. It was not.

GNOME gets peripheral battery information from UPower. UPower gets it from the kernel's `power_supply` interface. I checked each layer, and the same values kept appearing:

```
Magic Keyboard    0%
Magic Trackpad    4%
```

The Power window was faithfully displaying what Linux gave it. The bad percentage was already present before GNOME ever saw it.

### Two bytes explained the whole bug

Apple's Bluetooth HID devices expose battery information through input report `0x90`. Reading that raw report from my devices produced:

```
Magic Keyboard:  90 00 5e
Magic Trackpad:  90 04 5f
```

The first byte after `0x90` is a status byte. The next byte is the actual state of charge.

That means the keyboard's real charge was hexadecimal `5e`, or **94%**. The trackpad's was `5f`, or **95%**. Linux was reporting the preceding status bytes instead: `0` and `4`.

The suspicious numbers in GNOME suddenly made perfect sense. Linux was reading the right report at the wrong offset.

I later found a [proposed upstream Linux patch](https://patchew.org/linux/20260702192139.114809-1-pepemontfort%40gmail.com/) describing the same HID offset issue. That was reassuring, but it did not fix the machines already running kernels without the patch.

### The first solution almost worked

My first approach was to publish the correct percentages through BlueZ's standard battery provider interface.

That part worked. BlueZ could see **94%** and **95%**. But GNOME still showed **0%** and **4%**.

UPower deliberately avoids showing duplicate battery devices. When BlueZ and the kernel both describe the same keyboard or trackpad, it prefers the kernel's existing `power_supply` entry. So the clean userspace value was available, but the desktop correctly chose the older, incorrect kernel value.

It was a useful failure because it narrowed the problem: the fix had to reach the same interface UPower already trusted.

### I did not want the fix to become another project

Patching and rebuilding the kernel module would solve the bug at its source. It would also mean custom module signing on Secure Boot systems, kernel-version-specific builds, reboots, and maintenance after upgrades.

That might be reasonable for a kernel developer. It is not the experience I wanted for someone who just paired a keyboard.

The goal was to make Ubuntu feel more like a Mac, not turn a battery indicator into a weekend kernel-maintenance routine.

### What I built

[apple-hid-battery-fix](https://github.com/nishantapatil3/apple-hid-battery-fix) is a small Python service that corrects the percentage while leaving the normal Linux desktop path intact.

It automatically discovers Apple Bluetooth HID devices, reads their raw `0x90` battery report, and compares three things: the kernel percentage, the report's status byte, and the actual charge byte.

The service only activates when it sees the exact broken pattern: the kernel value matches the status byte and differs from the real charge. It then places a tiny live value over that device's existing read-only `capacity` attribute and asks udev to refresh it. UPower notices the change, and GNOME's Power window updates through the same interface it already uses.

The service checks once per minute, handles devices disconnecting and reconnecting, and uses short timeouts and a lock so repeated HID queries do not fight each other.

Most importantly, it becomes a no-op on a fixed kernel. If Linux already reports the real percentage, there is nothing to override.

### Safety mattered more than supporting everything

This workaround runs as root because reading `hidraw` devices and placing a file-level bind mount over sysfs require it. That made conservative behavior important.

There are no hard-coded Bluetooth addresses or personal device names. The service refuses unexpected values, will not replace a mount it does not own, and removes its temporary overrides during portable use or uninstall.

It probes other Apple Bluetooth keyboards, trackpads, and mice, but only changes a device when the raw report proves that exact offset bug is present. Unknown layouts are skipped.

### Getting it running

The installed version is a systemd service, but the program is also a standalone Python file for anyone who wants to inspect or run it portably.

```
git clone https://github.com/nishantapatil3/apple-hid-battery-fix.git
cd apple-hid-battery-fix
sudo ./install.sh
```

Then check what it detected:

```
sudo /usr/local/libexec/apple-hid-battery-override --status
```

On my machine, the result changed from **0%** and **4%** to the actual **94%** and **95%** in Ubuntu's Power window.

No GNOME extension. No replacement battery widget. No patched kernel. The rest of the desktop continues to use UPower normally.

### Why I am sharing this

Linux already did the important parts well. The keyboard paired. The trackpad worked. UPower and GNOME were both behaving consistently. One byte at the wrong offset made the final experience feel broken.

These small integration gaps matter because they are the difference between hardware merely working and hardware feeling native.

This project is a bridge for distributions that have not shipped the kernel fix yet. Once the upstream correction reaches everyone, the workaround should quietly stop doing anything. That is the best possible end state for it.

Project: [github.com/nishantapatil3/apple-hid-battery-fix](https://github.com/nishantapatil3/apple-hid-battery-fix)

Typing and scrolling were already working. Now the battery indicator stops lying. Sometimes that is the whole project.
