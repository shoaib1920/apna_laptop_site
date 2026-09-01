import { HubListing, P2PListing } from '../types';

/**
 * Formats a number into PKR standard currency format (e.g. Rs. 65,000)
 */
export function formatPKR(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
}

/**
 * Creates WhatsApp deep link for Hub laptop purchase/inquiry
 */
export function getHubWhatsAppLink(listing: HubListing): string {
  const adminWhatsApp = '923001234567';
  const text = `Assalam o Alaikum Apna Laptop Team!
I am interested in buying this verified laptop:
*${listing.title}*
Price: ${formatPKR(listing.sale_price)}
Condition: ${listing.condition}
Specs: ${listing.specs.cpu} | ${listing.specs.ram} | ${listing.specs.storage}

Please share payment/delivery details and availability. Thank you!`;

  return `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(text)}`;
}

/**
 * Creates WhatsApp deep link for P2P seller contact
 */
export function getP2PWhatsAppLink(listing: P2PListing, buyerName?: string): string {
  const cleanPhone = listing.seller_whatsapp.replace(/[^0-9]/g, '');
  const text = `Assalam o Alaikum ${listing.seller_name}!
I saw your laptop listing on *Apna Laptop*:
*${listing.title}* (${listing.seller_city})
Asking Price: ${formatPKR(listing.asking_price)}

Is this still available? I would like to inspect and discuss the deal.
From: ${buyerName || 'Interested Buyer'}`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Creates general Apna Laptop Support WhatsApp link
 */
export function getSupportWhatsAppLink(customQuery?: string): string {
  const text = customQuery || `Assalam o Alaikum Apna Laptop! I need help finding the right laptop or have a question about your verified stock.`;
  return `https://wa.me/923001234567?text=${encodeURIComponent(text)}`;
}
