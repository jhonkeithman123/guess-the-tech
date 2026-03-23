"use client";

type Manifest = {
  music?: string[];
  sfx?: Record<string, string[]>;
};

class AudioManager {
  manifest: Manifest = { music: [], sfx: {} };
  // Web Audio
  audioCtx: AudioContext | null = null;
  musicGain: GainNode | null = null;
  currentMusicSource: AudioBufferSourceNode | null = null;
  currentMusicUrl: string | null = null;
  musicBufferCache: Map<string, AudioBuffer> = new Map();
  htmlAudioPool: HTMLAudioElement[] = [];
  isStopping: boolean = false;
  isStarting: boolean = false;
  // fallback HTMLAudio for SFX or when WebAudio not available
  musicVolume = 0.5;
  sfxVolume = 1;
  // currently-playing SFX element (we interrupt it when playing a new one)
  currentSfx: HTMLAudioElement | null = null;
  // only create/resume AudioContext after an explicit user gesture
  userGestureAllowed: boolean = false;

  async enableAudioContext() {
    if (this.userGestureAllowed) return;
    this.userGestureAllowed = true;
    try {
      this._ensureAudioContext();
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        try {
          await this.audioCtx.resume();
        } catch (e) {
          console.debug("AudioManager: resume failed", e);
        }
      }
    } catch (e) {
      console.debug("AudioManager.enableAudioContext failed", e);
    }
  }

  async loadManifest() {
    try {
      const res = await fetch("/audio/manifest.json");
      if (!res.ok) return;
      const json = await res.json();
      this.manifest = json;
    } catch (e) {
      console.error("AudioManager: failed to load manifest", e);
    }
  }

  // Preload SFX into HTMLAudio elements to reduce first-play latency.
  async preloadSfx() {
    try {
      const sfx = this.manifest.sfx || {};
      for (const cat of Object.keys(sfx)) {
        const urls = sfx[cat] || [];
        for (const url of urls) {
          try {
            const a = new Audio(url);
            a.preload = "auto";
            a.volume = this.sfxVolume;
            // call load to hint the browser to fetch
            try {
              a.load();
            } catch (e) {}
            // keep in pool to reuse for lower latency
            this.htmlAudioPool.push(a);
          } catch (e) {
            // ignore individual failures
          }
        }
      }
    } catch (e) {
      console.error("AudioManager.preloadSfx failed", e);
    }
  }

  setManifest(manifest: Manifest) {
    this.manifest = manifest || { music: [], sfx: {} };
  }

  _ensureAudioContext() {
    if (this.audioCtx) return;
    try {
      const C = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new C();
      this.musicGain = this.audioCtx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.audioCtx.destination);
    } catch (e) {
      this.audioCtx = null;
      this.musicGain = null;
    }
  }

  async _loadBuffer(url: string) {
    if (this.musicBufferCache.has(url))
      return this.musicBufferCache.get(url) as AudioBuffer;
    if (!window.fetch) return null;
    try {
      // don't attempt to create or use WebAudio unless a user gesture allowed it
      if (!this.userGestureAllowed) return null;
      const res = await fetch(url);
      const ab = await res.arrayBuffer();
      this._ensureAudioContext();
      if (!this.audioCtx) return null;
      const decoded = await this.audioCtx.decodeAudioData(ab);
      this.musicBufferCache.set(url, decoded);
      return decoded;
    } catch (e) {
      console.error("AudioManager: failed to load buffer", url, e);
      return null;
    }
  }

  async playMusic(url?: string | null) {
    // guard to avoid race conditions that start multiple sources
    console.debug("AudioManager.playMusic request", {
      url,
      current: this.currentMusicUrl,
      isPlaying: this.isPlaying(),
      isStarting: this.isStarting,
      isStopping: this.isStopping,
    });
    if (this.isStarting) {
      console.debug("AudioManager.playMusic ignored: already starting");
      return;
    }
    if (url && this.currentMusicUrl === url && this.isPlaying()) {
      console.debug("AudioManager.playMusic noop: already playing same url");
      return;
    }
    this.isStarting = true;
    try {
      if (!url) url = this.manifest.music && this.manifest.music[0];
      if (!url) return;

      // stop existing if any (await to reduce race)
      if (this.currentMusicUrl && this.currentMusicUrl !== url) {
        await this.stopMusic();
        // small debounce to ensure previous source fully released
        await new Promise((r) => setTimeout(r, 60));
      }

      // ensure we only create/resume audio context if user gesture allowed
      if (this.userGestureAllowed) this._ensureAudioContext();
      // prefer WebAudio for gapless looping when context is allowed
      if (this.userGestureAllowed && this.audioCtx && this.musicGain) {
        // try to load decoded buffer
        const buffer = await this._loadBuffer(url);
        if (buffer) {
          const src = this.audioCtx.createBufferSource();
          src.buffer = buffer;
          src.loop = true;
          src.connect(this.musicGain);
          // start immediately at currentTime
          try {
            // resume context if suspended
            if (this.audioCtx.state === "suspended") {
              await this.audioCtx.resume();
            }
            src.start(0);
            this.currentMusicSource = src;
            this.currentMusicUrl = url;
            return;
          } catch (e) {
            console.warn(
              "AudioManager: BufferSource start failed, falling back to HTMLAudio",
              e,
            );
            try {
              src.disconnect();
            } catch (e) {}
            this.currentMusicSource = null;
          }
        }
      }

      // fallback: HTMLAudioElement loop (may have small gap)
      // try to reuse existing HTMLAudio for same url
      const anyThis = this as any;
      let audio: HTMLAudioElement | null = null;
      if (
        anyThis.currentMusic &&
        anyThis.currentMusic.src &&
        anyThis.currentMusic.src.endsWith(url)
      ) {
        audio = anyThis.currentMusic as HTMLAudioElement;
      }
      if (!audio) {
        audio = new Audio(url);
        audio.loop = true;
        audio.volume = this.musicVolume;
        this.htmlAudioPool.push(audio);
        anyThis.currentMusic = audio;
      }
      try {
        await audio.play();
      } catch (err) {
        console.debug("AudioManager: HTMLAudio play blocked or failed", err);
      }
      // store current url
      this.currentMusicUrl = url;
    } catch (e) {
      console.error("AudioManager.playMusic error", e);
    } finally {
      this.isStarting = false;
      console.debug("AudioManager.playMusic finished", {
        current: this.currentMusicUrl,
        isPlaying: this.isPlaying(),
      });
    }
  }

  async stopMusic() {
    console.debug("AudioManager.stopMusic start", {
      current: this.currentMusicUrl,
      isStopping: this.isStopping,
    });
    if (this.isStopping) {
      console.debug("AudioManager.stopMusic ignored: already stopping");
      return;
    }
    this.isStopping = true;
    try {
      if (this.currentMusicSource) {
        try {
          this.currentMusicSource.stop();
        } catch (e) {}
        try {
          this.currentMusicSource.disconnect();
        } catch (e) {}
        this.currentMusicSource = null;
      }
      // fallback HTMLAudio
      const anyThis = this as any;
      // stop all HTMLAudio elements we've created
      try {
        for (const a of this.htmlAudioPool) {
          try {
            a.pause();
          } catch (e) {}
          try {
            a.currentTime = 0;
          } catch (e) {}
        }
      } catch (e) {}
      this.htmlAudioPool = [];
      if (anyThis.currentMusic) anyThis.currentMusic = null;
      this.currentMusicUrl = null;
      // small yield so callers see stable state
      await new Promise((r) => setTimeout(r, 20));
      console.debug("AudioManager.stopMusic finished", {
        current: this.currentMusicUrl,
      });
    } catch (e) {
      console.error("AudioManager.stopMusic error", e);
    } finally {
      this.isStopping = false;
    }
  }

  playEffect(category: string) {
    try {
      const pool = (this.manifest.sfx && this.manifest.sfx[category]) || [];
      if (!pool.length) return;
      const url = pool[Math.floor(Math.random() * pool.length)];
      // Interrupt any currently-playing effect so sounds don't stack
      try {
        if (this.currentSfx) {
          try {
            this.currentSfx.pause();
          } catch (e) {}
          try {
            this.currentSfx.currentTime = 0;
          } catch (e) {}
          this.currentSfx = null;
        }
      } catch (e) {}

      // For SFX use HTMLAudio for simplicity and low latency
      const audio = new Audio(url);
      audio.volume = this.sfxVolume;
      // keep reference so we can interrupt it on next play
      this.currentSfx = audio;
      // when it ends or errors, clear the reference
      const clearRef = () => {
        if (this.currentSfx === audio) this.currentSfx = null;
        try {
          audio.onended = null;
          audio.onerror = null;
        } catch (e) {}
      };
      audio.onended = clearRef;
      audio.onerror = clearRef;
      audio.play().catch(() => {
        // if play fails, clear reference
        clearRef();
      });
    } catch (e) {
      console.error("AudioManager.playEffect error", e);
    }
  }

  setMusicVolume(v: number) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume;
    const anyThis = this as any;
    if (anyThis.currentMusic) {
      try {
        anyThis.currentMusic.volume = this.musicVolume;
      } catch (e) {}
    }
    // update all pooled audios as well
    for (const a of this.htmlAudioPool) {
      try {
        a.volume = this.musicVolume;
      } catch (e) {}
    }
  }

  setSfxVolume(v: number) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
  }

  isPlaying() {
    const anyThis = this as any;
    if (this.currentMusicSource) return true;
    if (anyThis.currentMusic) {
      try {
        return !anyThis.currentMusic.paused;
      } catch (e) {
        return true;
      }
    }
    return false;
  }
}

const audioManager = new AudioManager();
export default audioManager;
