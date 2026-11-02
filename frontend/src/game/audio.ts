export const AUDIO_ASSETS={music:'/audio/nhac_nen.mp3',bell:'/audio/temple-bell.mp3'};

// Stream the long music track; decode only the short recorded bell into memory.
export class Ambience {
  ctx: AudioContext | null = null;
  gain: GainNode | null = null;
  private music:HTMLAudioElement|null=null;
  private musicSource:MediaElementAudioSourceNode|null=null;
  private musicGain:GainNode|null=null;
  private bellGain:GainNode|null=null;
  private bellBuffer:AudioBuffer|null=null;
  private bellLoading:Promise<AudioBuffer|null>|null=null;
  private bellRequest:AbortController|null=null;
  private voices=new Set<AudioBufferSourceNode>();
  private level=0;
  stepAt = 0;
  start(volume: number) {
    if (!this.ctx) {
      const c = (this.ctx = new AudioContext()),
        g = (this.gain = c.createGain());
      g.connect(c.destination);
      g.gain.value=0;
      this.music=new Audio(AUDIO_ASSETS.music);this.music.loop=true;this.music.preload='none';
      this.musicSource=c.createMediaElementSource(this.music);
      this.musicGain=c.createGain();this.musicGain.gain.value=.32;
      this.musicSource.connect(this.musicGain).connect(g);
      this.bellGain=c.createGain();this.bellGain.gain.value=.75;this.bellGain.connect(g);
      void this.loadBell(c);
    }
    void this.ctx.resume().catch(()=>{});
    this.volume(volume);
  }
  private loadBell(ctx:AudioContext):Promise<AudioBuffer|null>{
    if(this.bellBuffer)return Promise.resolve(this.bellBuffer);
    if(this.bellLoading)return this.bellLoading;
    const request=new AbortController();this.bellRequest=request;
    const loading=(async()=>{
      try{
        const response=await fetch(AUDIO_ASSETS.bell,{signal:request.signal});
        if(!response.ok)return null;
        const bytes=await response.arrayBuffer();
        if(this.ctx!==ctx||request.signal.aborted)return null;
        const buffer=await ctx.decodeAudioData(bytes);
        if(this.ctx!==ctx||request.signal.aborted)return null;
        this.bellBuffer=buffer;return buffer;
      }catch{return null;}
    })();
    this.bellLoading=loading;
    void loading.then(()=>{if(this.ctx===ctx)this.bellLoading=null;});
    return loading;
  }
  tone(freq: number, duration: number, volume: number) {
    if (!this.ctx || !this.gain) return;
    const c = this.ctx,
      o = c.createOscillator(),
      g = c.createGain();
    o.frequency.setValueAtTime(freq, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      freq * 0.75,
      c.currentTime + duration,
    );
    g.gain.setValueAtTime(volume, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    o.connect(g).connect(this.gain);
    o.start();
    o.stop(c.currentTime + duration);
  }
  bell() {
    const ctx=this.ctx;
    if(!ctx||ctx.state==='closed'||this.level<=0)return;
    const play=(buffer:AudioBuffer|null)=>{
      if(!buffer||this.ctx!==ctx||this.level<=0||!this.bellGain)return;
      if(this.voices.size>=4){const oldest=this.voices.values().next().value;oldest?.stop();if(oldest)this.voices.delete(oldest);}
      const voice=ctx.createBufferSource();voice.buffer=buffer;voice.connect(this.bellGain);
      this.voices.add(voice);voice.onended=()=>{this.voices.delete(voice);voice.disconnect();};voice.start();
    };
    if(this.bellBuffer)play(this.bellBuffer);else void this.loadBell(ctx).then(play).catch(()=>{});
  }
  step() {
    if(this.level<=0||this.ctx?.state!=='running')return;
    if (Date.now() - this.stepAt < 420) return;
    this.stepAt = Date.now();
    this.tone(100, 0.08, 0.025);
  }
  volume(v: number) {
    this.level=Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
    if(this.gain&&this.ctx)this.gain.gain.setTargetAtTime(this.level,this.ctx.currentTime,.08);
    if(this.level<=0){
      this.music?.pause();for(const voice of this.voices)voice.stop();this.voices.clear();
    }else if(this.music?.paused){
      void this.ctx?.resume().catch(()=>{});void this.music.play().catch(()=>{});
    }
  }
  stop() {
    this.volume(0);this.bellRequest?.abort();
    this.music?.removeAttribute('src');this.music?.load();this.music=null;
    this.musicSource?.disconnect();this.musicGain?.disconnect();this.bellGain?.disconnect();
    if(this.ctx&&this.ctx.state!=='closed')void this.ctx.close().catch(()=>{});
    this.ctx=null;this.gain=null;this.musicSource=null;this.musicGain=null;this.bellGain=null;
    this.bellBuffer=null;this.bellLoading=null;this.bellRequest=null;
  }
}
