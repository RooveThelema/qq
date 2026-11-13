/**
 * Конфигурация мемов из assets/memes/ (статический список + автообновление через /api/memes).
 */

export const MEME_ADS = [
  {
    id: 'meme_01',
    type: 'image',
    src: './assets/memes/photo_2026-11-13_12-11-49.jpg',
    title: 'АРХИВ // 01',
    caption: '',
    duration: 4
  },
  {
    id: 'meme_02',
    type: 'image',
    src: './assets/memes/photo_2026-11-13_12-12-17.jpg',
    title: 'АРХИВ // 02',
    caption: '',
    duration: 4
  },
  {
    id: 'meme_03',
    type: 'image',
    src: './assets/memes/photo_2026-11-13_12-14-35.jpg',
    title: 'АРХИВ // 03',
    caption: '',
    duration: 4
  },
  {
    id: 'meme_04',
    type: 'image',
    src: './assets/memes/photo_2026-11-13_12-14-44.jpg',
    title: 'АРХИВ // 04',
    caption: '',
    duration: 4
  }
];

const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|ogv|mkv)(\?|#|$)/i;
const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?|#|$)/i;

/**
 * Определяет тип медиа ('video' | 'image') по явному полю, MIME-типу или расширению файла.
 */
export function detectMemeType(item) {
  if (typeof item === 'object' && item !== null) {
    if (item.type === 'video' || item.type === 'image') {
      return item.type;
    }
    if (typeof item.mime === 'string') {
      if (item.mime.startsWith('video/')) return 'video';
      if (item.mime.startsWith('image/')) return 'image';
    }
  }
  const src = typeof item === 'string' ? item : item?.src || '';
  if (VIDEO_EXT_RE.test(src)) return 'video';
  if (IMAGE_EXT_RE.test(src)) return 'image';
  return 'image';
}

/**
 * Приводит строковый путь или объект к единому формату элемента мем-рекламы.
 */
export function normalizeMemeItem(entry, index = 0) {
  const numTag = String(index + 1).padStart(2, '0');
  if (typeof entry === 'string') {
    const type = detectMemeType(entry);
    const fileName = entry.split('/').pop()?.split('?')[0] || `item_${numTag}`;
    return {
      id: `meme_${index}_${fileName}`,
      type,
      src: entry,
      title: `АРХИВ // ${numTag}`,
      caption: '',
      duration: type === 'video' ? 6 : 4,
      isCustom: false
    };
  }

  const type = detectMemeType(entry);
  return {
    id: entry.id || `meme_${index}`,
    type,
    src: entry.src,
    title: entry.title || `АРХИВ // ${numTag}`,
    caption: typeof entry.caption === 'string' ? entry.caption : '',
    duration: Number(entry.duration) > 0 ? Number(entry.duration) : (type === 'video' ? 6 : 4),
    isCustom: Boolean(entry.isCustom)
  };
}
