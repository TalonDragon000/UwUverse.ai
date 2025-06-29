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
    // First, check if the email already exists
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('email, source')
      .eq('email', email)
      .single();

    // If we found an existing subscriber, return success message
    if (existingSubscriber && !checkError) {
      return {
        success: true,
        message: source === 'pro_waitlist' 
          ? 'You\'re already on the Pro waitlist and subscribed to our newsletter!'
          : 'You\'re already subscribed to our newsletter. Thank you!',
      };
    }

    // If no existing subscriber found, proceed with insert
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert([
        {
          email,
          confirmation_token: crypto.randomUUID(),
          source, // Add source tracking
        }
      ])
      .select()
      .single();

    // Handle any database errors
    if (error) throw error;

    // In a real application, you would send a confirmation email here
    // using a service like SendGrid, Mailgun, etc.
    
    return {
      success: true,
      message: source === 'pro_waitlist' 
        ? 'Successfully added to Pro waitlist and subscribed to newsletter!'
        : 'Successfully subscribed to newsletter!',
      data,
    };
  } catch (error: any) {
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
      .select('email, created_at, confirmed')
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