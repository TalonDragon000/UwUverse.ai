import { supabase } from '../supabase/supabaseClient';

export const checkIfSubscribed = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('email', email)
      .single();

    // If we found a record, user is subscribed
    return !error && !!data;
  } catch (error) {
    // If there's an error (like no record found), user is not subscribed
    return false;
  }
};

export const subscribeToNewsletter = async (email: string, source: string = 'newsletter') => {
  try {
    // Call the Beehiiv Edge Function
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/beehiiv-newsletter`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        source,
        send_welcome_email: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to subscribe to newsletter');
    }

    const data = await response.json();

    return {
      success: true,
      message: data.message,
      already_subscribed: data.already_subscribed || false,
      beehiiv_status: data.beehiiv_status,
      fallback: data.fallback || false,
      note: data.note,
    };
  } catch (error: any) {
    console.error('Newsletter subscription error:', error);
    return {
      success: false,
      message: source === 'pro_waitlist'
        ? 'Failed to join Pro waitlist. Please try again.'
        : 'Failed to subscribe to newsletter. Please try again.',
    };
  }
};

export const confirmSubscription = async (token: string) => {
  try {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .update({ confirmed: true })
      .eq('confirmation_token', token)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      message: 'Successfully confirmed subscription!',
      data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to confirm subscription. Please try again.',
    };
  }
};

export const unsubscribeFromNewsletter = async (email: string) => {
  try {
    // Call Beehiiv API to unsubscribe
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/beehiiv-newsletter/unsubscribe`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Successfully unsubscribed from newsletter.',
      };
    }

    // Fallback to local database update
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (error) throw error;

    return {
      success: true,
      message: 'Successfully unsubscribed from newsletter.',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to unsubscribe. Please try again.',
    };
  }
};

// New function to get waitlist subscribers for admin/marketing purposes
export const getWaitlistSubscribers = async () => {
  try {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('email, created_at, confirmed, source')
      .eq('source', 'pro_waitlist')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch waitlist subscribers.',
    };
  }
};

// New function to sync local subscribers with Beehiiv (for admin use)
export const syncWithBeehiiv = async () => {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/beehiiv-newsletter/sync`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
    });

    const data = await response.json();

    return {
      success: response.ok,
      message: data.message,
      synced_count: data.synced_count,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to sync with Beehiiv.',
    };
  }
};