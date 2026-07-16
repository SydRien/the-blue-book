import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { LocalBlueBookRepository } from "@/lib/storage/localBlueBookRepository";
import { OfflineFirstRepository } from "@/lib/storage/offlineFirstRepository";
import { SupabaseBlueBookRepository } from "@/lib/storage/supabaseBlueBookRepository";
import type { BlueBookRepository } from "@/lib/storage/types";

export type StorageBackend = "local" | "supabase";

export function getStorageBackend(): StorageBackend {
  const configured = process.env.NEXT_PUBLIC_STORAGE_BACKEND;
  if (configured === "supabase") {
    return "supabase";
  }
  return "local";
}

/**
 * Factory for the active repository.
 * - local: LocalBlueBookRepository only
 * - supabase: OfflineFirst(local + supabase) when configured; else local fallback
 */
export function createBlueBookRepository(): BlueBookRepository {
  const local = new LocalBlueBookRepository();
  const backend = getStorageBackend();

  if (backend === "supabase" && isSupabaseConfigured()) {
    const remote = new SupabaseBlueBookRepository(getSupabaseClient());
    return new OfflineFirstRepository(local, remote);
  }

  return local;
}

export type { BlueBookRepository, SyncStatus } from "@/lib/storage/types";
