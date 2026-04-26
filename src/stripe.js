export const STRIPE_PLANS = [
  { id: 'mini', label: 'Mini', price: '12 zł / rok', paymentLink: import.meta.env.VITE_STRIPE_LINK_MINI, limit: 10,  scope: '1 kalkulator' },
  { id: 'midi', label: 'Midi', price: '20 zł / rok', paymentLink: import.meta.env.VITE_STRIPE_LINK_MIDI, limit: 20,  scope: '1 kalkulator' },
  { id: 'maxi', label: 'Maxi', price: '30 zł / rok', paymentLink: import.meta.env.VITE_STRIPE_LINK_MAXI, limit: 30,  scope: '1 kalkulator' },
  { id: 'vip',  label: 'VIP',  price: '60 zł / rok', paymentLink: import.meta.env.VITE_STRIPE_LINK_VIP,  limit: 100, scope: 'wszystkie kalkulatory' },
];
