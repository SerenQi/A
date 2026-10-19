"""合成全片音效并按 events.json 混成一条 180 秒的音轨：public/audio/sfx.wav"""
import json, wave, sys
import numpy as np

SR = 48000
DUR = 180.0
rng = np.random.default_rng(7)


def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    e = np.exp(-t / d)
    na = max(1, int(a * SR))
    e[:na] *= np.linspace(0, 1, na)
    return e


def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def highpass(x, fc):
    return x - lowpass(x, fc)


def tone(freqs, dur, d, amps=None):
    n = int(dur * SR)
    t = np.arange(n) / SR
    amps = amps or [1] * len(freqs)
    return sum(a * np.sin(2 * np.pi * f * t) for f, a in zip(freqs, amps)) * env(n, 0.003, d)


def stamp():
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    f = 40 + 70 * np.exp(-t / 0.05)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.18)
    click = highpass(rng.standard_normal(n), 1500) * env(n, 0.0005, 0.012) * 0.8
    crackle = highpass(rng.standard_normal(n), 3000) * (rng.random(n) > 0.985) * env(n, 0.001, 0.08) * 0.6
    return boom * 1.0 + click + crackle


def pop():
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    f = 520 + 600 * (t / t[-1])
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.025) * 0.6


def slide():
    n = int(0.38 * SR)
    x = lowpass(highpass(rng.standard_normal(n), 400), 3500)
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return x * e * 0.5


def type_():
    n = int(0.05 * SR)
    x = highpass(rng.standard_normal(n), 2000) * env(n, 0.0003, 0.006)
    th = tone([180], 0.05, 0.01) * 0.5
    return (x + th) * 0.6


def ding():
    return tone([1318.5, 2637, 1760, 3520], 1.0, 0.35, [0.6, 0.15, 0.45, 0.1]) * 0.7


def whoosh():
    n = int(0.5 * SR)
    x = rng.standard_normal(n)
    y = np.empty(n)
    acc = 0.0
    for i in range(n):
        fc = 300 + 2500 * np.sin(np.pi * i / n)
        a = np.exp(-2 * np.pi * fc / SR)
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y * np.sin(np.linspace(0, np.pi, n)) ** 2 * 1.6


def tick():
    return tone([1250, 2500], 0.06, 0.012, [1, 0.3]) * 0.5


def chime():
    out = np.zeros(int(1.2 * SR))
    for k, f in enumerate([1046.5, 1318.5, 1568, 2093]):
        s = tone([f, f * 4.01], 0.9, 0.3, [1, 0.12]) * 0.35
        i = int(k * 0.09 * SR)
        out[i:i + len(s)] += s
    return out


def thud():
    return tone([70, 140], 0.3, 0.08, [1, 0.3]) * 0.9


SOUNDS = {k: f() for k, f in {
    'stamp': stamp, 'pop': pop, 'slide': slide, 'type': type_, 'ding': ding,
    'whoosh': whoosh, 'tick': tick, 'chime': chime, 'thud': thud}.items()}
GAIN = {'stamp': 1.0, 'pop': 0.5, 'slide': 0.55, 'type': 0.45, 'ding': 0.8, 'whoosh': 0.45, 'tick': 0.45, 'chime': 0.6, 'thud': 0.8}

events = json.load(open(sys.argv[1]))
mix = np.zeros(int(DUR * SR) + SR)
for ev in events:
    s = SOUNDS[ev['kind']] * GAIN[ev['kind']]
    i = int(ev['t'] * SR)
    mix[i:i + len(s)] += s[: len(mix) - i]
mix = mix[: int(DUR * SR)]
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
mix *= 10 ** (-3 / 20) / max(1e-9, np.abs(mix).max())
pcm = (mix * 32767).astype('<i2')
stereo = np.repeat(pcm[:, None], 2, axis=1)
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print('wrote', sys.argv[2], len(events), 'events')
