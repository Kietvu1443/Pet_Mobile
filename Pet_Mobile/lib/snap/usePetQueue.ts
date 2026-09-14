import { useCallback, useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { fetchNextPet, postDislike, postLike, postSuperLike } from '../api/petSnap';
import { ApiError } from '../api/client';
import { adaptPet, type Pet } from './adapter';
import { queryClient } from '../query/queryClient';

type QueueStatus = 'loading' | 'ready' | 'empty' | 'error';

const TARGET = 10; // Giữ sẵn 10 thẻ trong hàng đợi để quẹt tốc độ cao không bao giờ bị cạn
const REFILL_THRESHOLD = 4; // Khi còn <= 4 thẻ thì tự động nạp tiếp trong nền
const MAX_FETCH_ATTEMPTS = 15; // Giới hạn số lần thử tránh lặp vô hạn

function prefetchPetImages(pets: Pet[]) {
  const uris = pets
    .slice(0, 5)
    .map((p) => p.avatarUri)
    .filter((uri): uri is string => Boolean(uri));
  if (uris.length > 0) {
    void Image.prefetch(uris);
  }
}

export function usePetQueue() {
  const [queue, setQueue] = useState<Pet[]>([]);
  const [status, setStatus] = useState<QueueStatus>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [acting, setActing] = useState(false);

  // Ref phản chiếu để logic async không bị stale closure.
  const queueRef = useRef<Pet[]>([]);
  const seenRef = useRef<Set<number>>(new Set());
  const hasMoreRef = useRef(true);
  const fillingRef = useRef(false);
  const activeCountRef = useRef(0);
  const reqSeqRef = useRef(0);
  const latestSeqRef = useRef(0);

  // Nạp hàng đợi tới TARGET bằng các lần GET, khử trùng theo id.
  const runFill = useCallback(async () => {
    if (fillingRef.current || !hasMoreRef.current) return;
    fillingRef.current = true;
    try {
      let attempts = 0;
      while (
        queueRef.current.length < TARGET &&
        hasMoreRef.current &&
        attempts < MAX_FETCH_ATTEMPTS
      ) {
        attempts += 1;
        const seq = ++reqSeqRef.current;
        const bundle = await fetchNextPet();
        if (seq >= latestSeqRef.current) {
          latestSeqRef.current = seq;
          hasMoreRef.current = bundle.hasMore;
        }
        const pet = adaptPet(bundle.pet);
        if (!pet) {
          hasMoreRef.current = false;
          break;
        }
        if (seenRef.current.has(pet.id)) {
          continue; // trùng -> bỏ qua, thử tiếp
        }
        seenRef.current.add(pet.id);
        if (!queueRef.current.some((p) => p.id === pet.id)) {
          queueRef.current = [...queueRef.current, pet];
        }
        setQueue((prev) => {
          if (prev.some((p) => p.id === pet.id)) return prev;
          const next = [...prev, pet];
          prefetchPetImages(next);
          return next;
        });
      }

      if (queueRef.current.length > 0) {
        setStatus('ready');
      } else if (hasMoreRef.current) {
        setStatus('loading');
      } else {
        setStatus('empty');
      }
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) {
        if (queueRef.current.length === 0) {
          setStatus('error');
          setErrorMsg(e instanceof Error ? e.message : 'Không thể tải thú cưng');
        }
      }
    } finally {
      fillingRef.current = false;
      // Nếu hàng đợi bị rút bớt trong lúc đang nạp, kích hoạt nạp tiếp ngay
      if (queueRef.current.length <= REFILL_THRESHOLD && hasMoreRef.current) {
        void runFill();
      }
    }
  }, []);

  // Nạp lần đầu.
  useEffect(() => {
    void runFill();
  }, [runFill]);

  const reload = useCallback(() => {
    seenRef.current = new Set();
    hasMoreRef.current = true;
    setErrorMsg('');
    setStatus('loading');
    setQueue([]);
    queueRef.current = [];
    void runFill();
  }, [runFill]);

  // Xử lý một hành động (like/dislike/superlike) trên thú cưng:
  // Lạc quan 100% không bao giờ khóa UI, chạy ngầm và tự động nạp bù.
  const act = useCallback(
    async (petId: number, kind: 'like' | 'dislike' | 'superlike') => {
      // 1. Gỡ thẻ ra khỏi hàng đợi hiển thị NGAY LẬP TỨC (đồng bộ cả ref lẫn state)
      queueRef.current = queueRef.current.filter((p) => p.id !== petId);
      setQueue((prev) => prev.filter((p) => p.id !== petId));

      // Nếu số thẻ còn lại thấp hơn ngưỡng, kích hoạt nạp nền ngay
      if (queueRef.current.length <= REFILL_THRESHOLD && hasMoreRef.current) {
        void runFill();
      }

      // 2. Chạy request API trong nền mà không chặn UI
      activeCountRef.current += 1;
      setActing(true);
      const seq = ++reqSeqRef.current;

      try {
        let bundle;
        if (kind === 'superlike') {
          bundle = await postSuperLike(petId);
        } else if (kind === 'like') {
          bundle = await postLike(petId);
        } else {
          bundle = await postDislike(petId);
        }

        queryClient.invalidateQueries({ queryKey: ['favorites'] });
        if (seq >= latestSeqRef.current) {
          latestSeqRef.current = seq;
          hasMoreRef.current = bundle.hasMore;
        }

        const pet = adaptPet(bundle.pet);
        if (pet && !seenRef.current.has(pet.id)) {
          seenRef.current.add(pet.id);
          if (!queueRef.current.some((p) => p.id === pet.id)) {
            queueRef.current = [...queueRef.current, pet];
          }
          setQueue((prev) => {
            if (prev.some((p) => p.id === pet.id)) return prev;
            const next = [...prev, pet];
            prefetchPetImages(next);
            return next;
          });
        }

        // Kiểm tra nạp lại lần nữa nếu vẫn thiếu
        if (queueRef.current.length <= REFILL_THRESHOLD && hasMoreRef.current) {
          void runFill();
        }
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 401)) {
          console.warn('[usePetQueue] Action failed:', e);
        }
      } finally {
        activeCountRef.current = Math.max(0, activeCountRef.current - 1);
        if (activeCountRef.current === 0) {
          setActing(false);
        }
      }
    },
    [runFill],
  );

  return {
    queue,
    status,
    errorMsg,
    acting,
    like: (petId: number) => act(petId, 'like'),
    dislike: (petId: number) => act(petId, 'dislike'),
    superlike: (petId: number) => act(petId, 'superlike'),
    reload,
  };
}

