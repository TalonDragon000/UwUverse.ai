import { supabase } from '../supabase/supabaseClient';

export const subscribeToNewsletter = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert([
        {
          email,
          confirmation_token: crypto.randomUUID(),
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // In a real application, you would send a confirmation email here
    // using a service like SendGrid, Mailgun, etc.
    
    return {
      success: true,
      message: 'Successfully subscribed to newsletter!',
      data,
    };
  } catch (error) {
    if (error.code === '23505') { // unique_violation
      return {
        success: false,
        message: 'This email is already subscribed to our newsletter.',
      };
    }
    
    return {
      success: false,
      message: 'Failed to subscribe to newsletter. Please try again.',
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