import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SubscribeRequest {
  email: string;
  source?: string;
  send_welcome_email?: boolean;
}

interface BeehiivSubscriber {
  email: string;
  status: 'active' | 'pending' | 'unsubscribed';
  created: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referring_site?: string;
  custom_fields?: Record<string, any>;
}

interface BeehiivResponse {
  data?: BeehiivSubscriber;
  errors?: Array<{
    message: string;
    code: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, source = 'newsletter', send_welcome_email = true } = await req.json() as SubscribeRequest;

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Valid email address is required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const beehiivApiKey = Deno.env.get('BEEHIIV_API_KEY');
    const publicationId = Deno.env.get('BEEHIIV_PUBLICATION_ID') || '33998d63-a190-45ca-86d5-abc88c0fc516';

    if (!beehiivApiKey) {
      console.log('Beehiiv API key not configured, storing locally only');
      
      // Store in local database only
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Check if already subscribed locally
      const { data: existingSubscriber } = await supabase
        .from('newsletter_subscribers')
        .select('email, source')
        .eq('email', email)
        .single();

      if (existingSubscriber) {
        return new Response(
          JSON.stringify({ 
            success: true,
            message: source === 'pro_waitlist' 
              ? 'You\'re already on the Pro waitlist and subscribed to our newsletter!'
              : 'You\'re already subscribed to our newsletter. Thank you!',
            already_subscribed: true
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Add to local database
      const { error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert([{
          email,
          source,
          confirmed: true, // Auto-confirm since we can't send emails yet
          confirmation_token: crypto.randomUUID(),
        }]);

      if (insertError) {
        throw insertError;
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: source === 'pro_waitlist' 
            ? 'Successfully added to Pro waitlist! You\'ll be notified when premium features launch.'
            : 'Successfully subscribed to newsletter! You\'ll receive updates about UwUverse.ai.',
          local_only: true,
          note: 'Email confirmation will be available once Beehiiv integration is complete.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Beehiiv API integration
    try {
      console.log('Subscribing to Beehiiv newsletter...');
      
      // First, check if subscriber already exists
      const checkResponse = await fetch(`https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${beehiivApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.data && checkData.data.length > 0) {
          const existingSubscriber = checkData.data[0];
          
          // Update local database
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const supabase = createClient(supabaseUrl, supabaseServiceKey);

          await supabase
            .from('newsletter_subscribers')
            .upsert([{
              email,
              source,
              confirmed: existingSubscriber.status === 'active',
              confirmation_token: crypto.randomUUID(),
            }]);

          return new Response(
            JSON.stringify({ 
              success: true,
              message: source === 'pro_waitlist' 
                ? 'You\'re already on the Pro waitlist and subscribed to our newsletter!'
                : 'You\'re already subscribed to our newsletter. Thank you!',
              already_subscribed: true,
              beehiiv_status: existingSubscriber.status
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }

      // Subscribe to Beehiiv
      const subscribeResponse = await fetch(`https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${beehiivApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          send_welcome_email,
          utm_source: source,
          utm_medium: 'website',
          utm_campaign: source === 'pro_waitlist' ? 'pro_waitlist' : 'newsletter_signup',
          custom_fields: {
            signup_source: source,
            signup_date: new Date().toISOString(),
          }
        }),
      });

      const beehiivData: BeehiivResponse = await subscribeResponse.json();

      if (!subscribeResponse.ok) {
        console.error('Beehiiv API error:', beehiivData);
        
        // Check if it's a "already subscribed" error
        if (beehiivData.errors?.some(error => error.message.toLowerCase().includes('already'))) {
          return new Response(
            JSON.stringify({ 
              success: true,
              message: source === 'pro_waitlist' 
                ? 'You\'re already on the Pro waitlist and subscribed to our newsletter!'
                : 'You\'re already subscribed to our newsletter. Thank you!',
              already_subscribed: true
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        
        throw new Error(beehiivData.errors?.[0]?.message || 'Failed to subscribe to Beehiiv');
      }

      // Update local database with Beehiiv subscription
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase
        .from('newsletter_subscribers')
        .upsert([{
          email,
          source,
          confirmed: beehiivData.data?.status === 'active',
          confirmation_token: crypto.randomUUID(),
        }]);

      console.log('Successfully subscribed to Beehiiv');

      return new Response(
        JSON.stringify({ 
          success: true,
          message: source === 'pro_waitlist' 
            ? 'Successfully added to Pro waitlist and subscribed to newsletter! Check your email for confirmation.'
            : 'Successfully subscribed to newsletter! Check your email for confirmation.',
          beehiiv_status: beehiivData.data?.status,
          send_welcome_email
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } catch (beehiivError) {
      console.error('Beehiiv integration error:', beehiivError);
      
      // Fallback to local storage
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Check if already subscribed locally
      const { data: existingSubscriber } = await supabase
        .from('newsletter_subscribers')
        .select('email')
        .eq('email', email)
        .single();

      if (existingSubscriber) {
        return new Response(
          JSON.stringify({ 
            success: true,
            message: source === 'pro_waitlist' 
              ? 'You\'re already on the Pro waitlist and subscribed to our newsletter!'
              : 'You\'re already subscribed to our newsletter. Thank you!',
            already_subscribed: true
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Add to local database as fallback
      await supabase
        .from('newsletter_subscribers')
        .insert([{
          email,
          source,
          confirmed: false, // Will be confirmed when Beehiiv is working
          confirmation_token: crypto.randomUUID(),
        }]);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: source === 'pro_waitlist' 
            ? 'Successfully added to Pro waitlist! You\'ll be notified when premium features launch.'
            : 'Successfully subscribed to newsletter! You\'ll receive updates about UwUverse.ai.',
          fallback: true,
          note: 'Subscription saved locally. Email confirmation will be sent once Beehiiv integration is complete.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to subscribe to newsletter. Please try again later.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});