// Detect third-party video providers, return how to render their content,
// and signal the natural aspect ratio so the controller can size the container.
// Returns { kind, src, provider?, aspectRatio?, allow?, embeddable }.

const YOUTUBE_SHORTS_RE = /youtube\.com\/shorts\/([\w-]{11})/;
const YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([\w-]{11})/;
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/;
const TIKTOK_RE = /tiktok\.com\/(?:@[\w.-]+\/video\/|embed\/(?:v\d\/)?|t\/)(\d+)/;

const IFRAME_ALLOW = 'autoplay; encrypted-media; picture-in-picture; fullscreen';

function youtubeSrc(id, { autoplay, loop, mute }) {
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    playsinline: '1',
    modestbranding: '1',
    rel: '0',
    controls: '0',
  });
  if (mute) params.set('mute', '1');
  if (loop) {
    params.set('loop', '1');
    params.set('playlist', id);
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

function vimeoSrc(id, { autoplay, loop, mute }) {
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    playsinline: '1',
    title: '0',
    byline: '0',
    portrait: '0',
  });
  if (mute) params.set('muted', '1');
  if (loop) params.set('loop', '1');
  return `https://player.vimeo.com/video/${id}?${params}`;
}

function tiktokSrc(id, { autoplay, mute }) {
  const params = new URLSearchParams();
  if (!autoplay) params.set('autoplay', '0');
  if (mute) params.set('mute_video', '1');
  const qs = params.toString();
  return `https://www.tiktok.com/embed/v2/${id}${qs ? `?${qs}` : ''}`;
}

export function parseMediaSource(url, opts = {}) {
  const { loop = false, autoplay = true, mute = false } = opts;

  if (!url || typeof url !== 'string') {
    return { kind: 'video', src: '', embeddable: false };
  }
  const trimmed = url.trim();

  let m = trimmed.match(YOUTUBE_SHORTS_RE);
  if (m) {
    return {
      kind: 'iframe',
      provider: 'youtube-shorts',
      aspectRatio: '9:16',
      src: youtubeSrc(m[1], { autoplay, loop, mute }),
      allow: IFRAME_ALLOW,
      embeddable: true,
    };
  }

  m = trimmed.match(YOUTUBE_RE);
  if (m) {
    return {
      kind: 'iframe',
      provider: 'youtube',
      aspectRatio: '16:9',
      src: youtubeSrc(m[1], { autoplay, loop, mute }),
      allow: IFRAME_ALLOW,
      embeddable: true,
    };
  }

  m = trimmed.match(VIMEO_RE);
  if (m) {
    return {
      kind: 'iframe',
      provider: 'vimeo',
      aspectRatio: '16:9',
      src: vimeoSrc(m[1], { autoplay, loop, mute }),
      allow: IFRAME_ALLOW,
      embeddable: true,
    };
  }

  m = trimmed.match(TIKTOK_RE);
  if (m) {
    return {
      kind: 'iframe',
      provider: 'tiktok',
      aspectRatio: '9:16',
      src: tiktokSrc(m[1], { autoplay, mute }),
      allow: IFRAME_ALLOW,
      embeddable: true,
    };
  }

  return { kind: 'video', src: trimmed, embeddable: false };
}

export function isEmbedUrl(url) {
  return parseMediaSource(url).kind === 'iframe';
}
