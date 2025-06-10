import Purchases from '@revenuecat/purchases-js';
import { supabase } from '../supabase/supabaseClient';

const REVCAT_API_KEY = import.meta.env.VITE_REVCAT_API_KEY;

export const initializeRevenueCat = () => {
  if (!REVCAT_API_KEY) {
    console.error('RevenueCat API key not found');
    return;
  }

  Purchases.configure({ apiKey: REVCAT_API_KEY });
};

export const getSubscriptionPlans = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages || [];
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return [];
  }
};

export const purchaseSubscription = async (packageId: string) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageId);
    
    // Update user profile with new subscription status
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_profiles').update({
        subscription_status: customerInfo.entitlements.active['pro_access'] ? 'pro' : 'free',
        subscription_period_end: new Date(customerInfo.latestExpirationDate).toISOString(),
      }).eq('user_id', user.id);
    }

    return customerInfo;
  } catch (error) {
    console.error('Error purchasing subscription:', error);
    throw error;
  }
};

export const restorePurchases = async () => {
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    throw error;
  }
};

export const getCurrentSubscriptionStatus = async () => {
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return {
      isPro: customerInfo.entitlements.active['pro_access'] !== undefined,
      expirationDate: customerInfo.latestExpirationDate,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return { isPro: false, expirationDate: null };
  }
};