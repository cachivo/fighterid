import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SocialPost {
  id: string;
  author_id: string;
  author_type: 'fighter' | 'admin';
  content: string;
  media_urls: string[] | null;
  post_type: 'text' | 'image' | 'video' | 'news';
  likes_count: number;
  comments_count: number;
  active: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  author_name?: string;
  author_nickname?: string;
  author_avatar?: string;
  is_liked?: boolean;
}

export interface CreatePostData {
  content: string;
  media_urls?: string[];
  post_type?: 'text' | 'image' | 'video' | 'news';
}

export function useSocialPosts() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPosts = async (limit = 20, offset = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get posts first
      const { data: postsData, error: postsError } = await supabase
        .from('social_posts')
        .select('*')
        .eq('active', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (postsError) throw postsError;

      // Get fighter info for fighter posts
      const fighterPosts = postsData?.filter(p => p.author_type === 'fighter') || [];
      let fighterProfiles: any[] = [];
      
      if (fighterPosts.length > 0) {
        const { data: profiles } = await supabase
          .from('fighter_profiles')
          .select('id, first_name, last_name, nickname, avatar_url')
          .in('id', fighterPosts.map(p => p.author_id));
        
        fighterProfiles = profiles || [];
      }

      // Get likes for current user if authenticated
      let likesData: any[] = [];
      if (user && postsData?.length) {
        const { data: userLikes } = await supabase
          .from('post_likes')
          .select('post_id')
          .in('post_id', postsData.map(p => p.id));
        
        likesData = userLikes || [];
      }

      const enrichedPosts: SocialPost[] = postsData?.map(post => {
        const fighterProfile = fighterProfiles.find(fp => fp.id === post.author_id);
        
        return {
          ...post,
          author_type: post.author_type as 'fighter' | 'admin',
          post_type: post.post_type as 'text' | 'image' | 'video' | 'news',
          author_name: post.author_type === 'fighter' 
            ? `${fighterProfile?.first_name || ''} ${fighterProfile?.last_name || ''}`.trim() || 'Peleador'
            : 'Batalla de Gallos',
          author_nickname: fighterProfile?.nickname,
          author_avatar: fighterProfile?.avatar_url,
          is_liked: likesData.some(like => like.post_id === post.id)
        };
      }) || [];

      if (offset === 0) {
        setPosts(enrichedPosts);
      } else {
        setPosts(prev => [...prev, ...enrichedPosts]);
      }

    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Error al cargar los posts');
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: CreatePostData, authorType: 'fighter' | 'admin', authorId: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para crear posts');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('social_posts')
        .insert([{
          author_id: authorId,
          author_type: authorType,
          content: postData.content,
          media_urls: postData.media_urls || null,
          post_type: postData.post_type || 'text'
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Post publicado exitosamente');
      fetchPosts(); // Refresh posts
      return data;
    } catch (err) {
      console.error('Error creating post:', err);
      toast.error('Error al crear el post');
      return null;
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para dar like');
      return;
    }

    try {
      // Get current user's app_user record
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!appUser) {
        toast.error('Usuario no encontrado');
        return;
      }

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', appUser.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert([{
            post_id: postId,
            user_id: appUser.id
          }]);
      }

      // Update local state
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? {
              ...post,
              likes_count: existingLike ? post.likes_count - 1 : post.likes_count + 1,
              is_liked: !existingLike
            }
          : post
      ));

    } catch (err) {
      console.error('Error toggling like:', err);
      toast.error('Error al dar like');
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('social_posts')
        .update({ active: false })
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.filter(post => post.id !== postId));
      toast.success('Post eliminado');
    } catch (err) {
      console.error('Error deleting post:', err);
      toast.error('Error al eliminar el post');
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return {
    posts,
    loading,
    error,
    fetchPosts,
    createPost,
    toggleLike,
    deletePost
  };
}