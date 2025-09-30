import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchUser {
  id: string;
  handle: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export const useUserSearch = () => {
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_user')
        .select('id, handle, first_name, last_name, avatar_url, bio')
        .or(`handle.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    searchUsers
  };
};
