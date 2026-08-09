// Quản lý hàng đợi thú cưng cho deck PetSnap.
//
// Vì GET /pet-snap trả ngẫu nhiên 1 con và KHÔNG ghi nhận tương tác, nhiều lần
// gọi có thể trả trùng -> phải khử trùng bằng tập seenIds. like/dislike vừa lưu
// tương tác vừa trả con KẾ TIẾP nên dùng luôn để nạp thêm hàng đợi.
//
// Hook chỉ làm việc với model Pet (đã qua adapter) — không bao giờ chạm DTO thô.
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchNextPet, postDislike, postLike } from '../api/petSnap';
import { superLikeFavorite } from '../api/favorites';
import { ApiError } from '../api/client';
import { adaptPet, type Pet } from './adapter';
import { queryClient } from '../query/queryClient';

type QueueStatus = 'loading' | 'ready' | 'empty' | 'error';

const TARGET = 3; // số thẻ muốn giữ sẵn trong hàng đợi khi cần trả ra dữ liệu
const MAX_FETCH_ATTEMPTS = 6; // chặn vòng lặp vô hạn khi GET trả trùng liên tục

export function usePetQueue() {
  const [queue, setQueue] = useState<Pet[]>([]);
  const [status, setStatus] = useState<QueueStatus>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [acting, setActing] = useState(false);

  // Ref phản chiếu để logic async không bị stale closure.
  const seenRef = useRef<Set<number>>(new Set());
  const hasMoreRef = useRef(true);
  const fillingRef = useRef(false);

  // Nạp hàng đợi tới TARGET bằng các lần GET, khử trùng theo id.
  // Trả về mảng pet mới để caller cập nhật state cùng lúc với việc quyết định status.
  const fetchToFill = useCallback(async (current: Pet[]): Promise<Pet[]> => {
    const next = [...current];
    let attempts = 0;
    while (next.length < TARGET && hasMoreRef.current && attempts < MAX_FETCH_ATTEMPTS) {
      attempts += 1;
      const bundle = await fetchNextPet();
      hasMoreRef.current = bundle.hasMore;
      const pet = adaptPet(bundle.pet);
      if (!pet) {
        hasMoreRef.current = false;
        break;
      }
      if (seenRef.current.has(pet.id)) {
        continue; // trùng -> bỏ qua, thử tiếp
      }
      seenRef.current.add(pet.id);
      next.push(pet);
    }
    return next;
  }, []);

  const runFill = useCallback(
    async (base: Pet[]) => {
      if (fillingRef.current) return;
      fillingRef.current = true;
      try {
        const filled = await fetchToFill(base);
        setQueue(filled);
        setStatus(filled.length > 0 ? 'ready' : 'empty');
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 401)) {
          setStatus('error');
          setErrorMsg(e instanceof Error ? e.message : 'Không thể tải thú cưng');
        }
      } finally {
        fillingRef.current = false;
      }
    },
    [fetchToFill],
  );

  // Nạp lần đầu.
  useEffect(() => {
    void runFill([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = useCallback(() => {
    seenRef.current = new Set();
    hasMoreRef.current = true;
    setErrorMsg('');
    setStatus('loading');
    void runFill([]);
  }, [runFill]);

  // Xử lý một hành động (like/dislike/superlike) trên thú cưng ở đầu hàng đợi.
  const act = useCallback(
    async (petId: number, kind: 'like' | 'dislike' | 'superlike') => {
      if (acting) return;
      setActing(true);
      // Lạc quan: bỏ con đang xử lý khỏi hàng đợi ngay.
      const remaining = queue.filter((p) => p.id !== petId);
      setQueue(remaining);
      try {
        let bundle;
        if (kind === 'superlike') {
          await superLikeFavorite(petId);
          bundle = await fetchNextPet();
        } else {
          bundle = kind === 'like' ? await postLike(petId) : await postDislike(petId);
        }
        queryClient.invalidateQueries({ queryKey: ['favorites'] });
        hasMoreRef.current = bundle.hasMore;
        const base = [...remaining];
        const pet = adaptPet(bundle.pet);
        if (pet && !seenRef.current.has(pet.id)) {
          seenRef.current.add(pet.id);
          base.push(pet);
        }
        await runFill(base);
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 401)) {
          setStatus('error');
          setErrorMsg(e instanceof Error ? e.message : 'Không thể xử lý thao tác');
        }
      } finally {
        setActing(false);
      }
    },
    [acting, queue, runFill],
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
