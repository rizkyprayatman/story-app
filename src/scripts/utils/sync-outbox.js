import * as idb from './indexeddb';
import { postStory } from '../data/api';

export async function syncOutbox() {
  try {
    const items = await idb.getAllOutbox();
    if (!items || !items.length) return { synced: 0 };
    let synced = 0;
    for (const it of items) {
      try {
        const fd = new FormData();
        Object.keys(it).forEach((k) => {
          if (k === 'id' || k === 'createdAt') return;
          const v = it[k];
          if (v && v.name && v.type && v.size && !v.data) {
            fd.append(k, JSON.stringify({ name: v.name, type: v.type, size: v.size }));
          } else {
            fd.append(k, v);
          }
        });
        const res = await postStory(fd);
        if (res && !res.error) {
          await idb.removeOutbox(it.id);
          synced += 1;
        }
      } catch (e) {
        console.error('sync item failed', e);
      }
    }
    return { synced };
  } catch (e) {
    console.error('syncOutbox error', e);
    return { error: true };
  }
}
