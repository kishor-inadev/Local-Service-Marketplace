/**
 * Indian States and Union Territories
 * Use in address forms for the State dropdown.
 */
export const INDIA_STATES: Record<string, string> = {
  AN: 'Andaman & Nicobar Islands',
  AP: 'Andhra Pradesh',
  AR: 'Arunachal Pradesh',
  AS: 'Assam',
  BR: 'Bihar',
  CH: 'Chandigarh',
  CG: 'Chhattisgarh',
  DD: 'Dadra & Nagar Haveli and Daman & Diu',
  DL: 'Delhi',
  GA: 'Goa',
  GJ: 'Gujarat',
  HR: 'Haryana',
  HP: 'Himachal Pradesh',
  JK: 'Jammu & Kashmir',
  JH: 'Jharkhand',
  KA: 'Karnataka',
  KL: 'Kerala',
  LA: 'Ladakh',
  LD: 'Lakshadweep',
  MP: 'Madhya Pradesh',
  MH: 'Maharashtra',
  MN: 'Manipur',
  ML: 'Meghalaya',
  MZ: 'Mizoram',
  NL: 'Nagaland',
  OD: 'Odisha',
  PY: 'Puducherry',
  PB: 'Punjab',
  RJ: 'Rajasthan',
  SK: 'Sikkim',
  TN: 'Tamil Nadu',
  TS: 'Telangana',
  TR: 'Tripura',
  UP: 'Uttar Pradesh',
  UK: 'Uttarakhand',
  WB: 'West Bengal',
};

export const INDIA_STATE_OPTIONS = Object.entries(INDIA_STATES).map(
  ([code, name]) => ({ value: code, label: name }),
);

/** Default country code for India */
export const DEFAULT_COUNTRY = 'IN';

/** Default timezone for India */
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/** Default currency for India */
export const DEFAULT_CURRENCY = 'INR';
