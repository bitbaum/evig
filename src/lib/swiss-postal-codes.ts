/**
 * Swiss postal code lookup data
 * Based on official Swiss Post data
 * This is a simplified lookup for common postal codes
 */

export interface PostalCodeData {
  postal_code: string;
  city: string;
  canton: string;
}

const SWISS_POSTAL_CODES: PostalCodeData[] = [
  // Zürich area
  { postal_code: '8000', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8001', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8002', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8003', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8004', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8005', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8006', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8008', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8032', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8037', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8038', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8041', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8044', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8045', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8046', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8047', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8048', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8049', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8050', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8051', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8052', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8053', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8055', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8057', city: 'Zürich', canton: 'Zürich' },
  { postal_code: '8064', city: 'Zürich', canton: 'Zürich' },

  // Other major cities
  { postal_code: '4000', city: 'Basel', canton: 'Basel-Stadt' },
  { postal_code: '4001', city: 'Basel', canton: 'Basel-Stadt' },
  { postal_code: '4051', city: 'Basel', canton: 'Basel-Stadt' },
  { postal_code: '4052', city: 'Basel', canton: 'Basel-Stadt' },
  { postal_code: '4053', city: 'Basel', canton: 'Basel-Stadt' },

  { postal_code: '1000', city: 'Lausanne', canton: 'Waadt' },
  { postal_code: '1003', city: 'Lausanne', canton: 'Waadt' },
  { postal_code: '1004', city: 'Lausanne', canton: 'Waadt' },
  { postal_code: '1005', city: 'Lausanne', canton: 'Waadt' },
  { postal_code: '1006', city: 'Lausanne', canton: 'Waadt' },
  { postal_code: '1007', city: 'Lausanne', canton: 'Waadt' },

  { postal_code: '3000', city: 'Bern', canton: 'Bern' },
  { postal_code: '3004', city: 'Bern', canton: 'Bern' },
  { postal_code: '3005', city: 'Bern', canton: 'Bern' },
  { postal_code: '3006', city: 'Bern', canton: 'Bern' },
  { postal_code: '3007', city: 'Bern', canton: 'Bern' },
  { postal_code: '3008', city: 'Bern', canton: 'Bern' },

  { postal_code: '6000', city: 'Luzern', canton: 'Luzern' },
  { postal_code: '6002', city: 'Luzern', canton: 'Luzern' },
  { postal_code: '6003', city: 'Luzern', canton: 'Luzern' },
  { postal_code: '6004', city: 'Luzern', canton: 'Luzern' },
  { postal_code: '6005', city: 'Luzern', canton: 'Luzern' },
  { postal_code: '6006', city: 'Luzern', canton: 'Luzern' },

  { postal_code: '5000', city: 'Aarau', canton: 'Aargau' },
  { postal_code: '5001', city: 'Aarau', canton: 'Aargau' },

  { postal_code: '7000', city: 'Chur', canton: 'Graubünden' },
  { postal_code: '7001', city: 'Chur', canton: 'Graubünden' },

  { postal_code: '9000', city: 'St. Gallen', canton: 'St. Gallen' },
  { postal_code: '9001', city: 'St. Gallen', canton: 'St. Gallen' },
];

/**
 * Look up Swiss postal code data
 */
export function lookupSwissPostalCode(postalCode: string): PostalCodeData | null {
  // Remove any non-numeric characters and ensure 4 digits
  const cleanCode = postalCode.replace(/\D/g, '');
  if (cleanCode.length !== 4) {
    return null;
  }

  return SWISS_POSTAL_CODES.find(pc => pc.postal_code === cleanCode) || null;
}

/**
 * Get all available postal codes for autocomplete
 */
export function getAllSwissPostalCodes(): PostalCodeData[] {
  return SWISS_POSTAL_CODES;
}

/**
 * Search postal codes by city name
 */
export function searchSwissCities(searchTerm: string): PostalCodeData[] {
  const term = searchTerm.toLowerCase();
  return SWISS_POSTAL_CODES.filter(pc =>
    pc.city.toLowerCase().includes(term) ||
    pc.canton.toLowerCase().includes(term)
  );
}

/**
 * Validate Swiss postal code format
 */
export function isValidSwissPostalCode(postalCode: string): boolean {
  const cleanCode = postalCode.replace(/\D/g, '');
  return cleanCode.length === 4 && cleanCode >= '1000' && cleanCode <= '9999';
}



