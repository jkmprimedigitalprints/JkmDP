/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, PortfolioItem, FAQItem, Order, Testimonial, MaterialEquipment, Expense } from '../types';
import { ASSETS } from './images';

export const BUSINESS_INFO = {
  name: 'JKM Prime Digital Prints',
  tagline: 'Precision Printing. Premium Quality. Quick Turnaround.',
  description: 'Your premium digital printing partner in the Philippines. We specialize in high-quality rush photo printing, ID packages, customized corporate gifts, sublimated mugs, DTF t-shirts, personalized notebooks, and sintra board displays.',
  phone: '09524776545',
  email: 'jkmprimedigitalprints@gmail.com',
  address: 'GHQ Road South SIgnal Taguig.',
  hours: 'Monday - Saturday: 8:00 AM - 6:00 PM',
  facebook: 'https://www.facebook.com/Jkmprimedigitalprints',
  instagram: 'https://instagram.com/jkmprimedigitalprints',
};

export const PRODUCTS: Product[] = [
  {
    id: 'prod-tshirt',
    name: 'Customized T-Shirts & Apparel',
    basePrice: 320,
    category: 'Apparel',
    imageUrl: '/tshirtcover.jpg',
    description: 'High-stretch, crack-resistant Direct-to-Film (DTF) full color heat transfers on 100% cotton and dri-fit shirts.'
  },
  {
    id: 'prod-mug',
    name: 'Customized Sublimation Mugs',
    basePrice: 90,
    category: 'Drinkware',
    imageUrl: '/mug2.jpg',
    description: 'Vibrant full-wrap ceramic mugs, magic heat-activated mugs, and gift-boxed personalized coffee cups.'
  },
  {
    id: 'prod-tote',
    name: 'Customized Canvas Tote Bags',
    basePrice: 149,
    category: 'Bags & Pouches',
    imageUrl: '/totebag1.jpg',
    description: 'Durable heavy-duty canvas tote bags available in flat or expandable bottom base styles with vibrant color prints.'
  },
  {
    id: 'prod-wallet',
    name: 'Customized Canvas Wallets & Pouches',
    basePrice: 59,
    category: 'Bags & Pouches',
    imageUrl: '/wallet 1.jpg',
    description: 'Custom printed zippered canvas coin purses, makeup pouches, and utility organizers with smooth zip closures.'
  },
  {
    id: 'prod-sintra',
    name: 'Customized Sintra Board Displays',
    basePrice: 120,
    category: 'Wall & Displays',
    imageUrl: '/sintra1.jpg',
    description: 'Waterproof, fade-resistant 3mm matte or glossy PVC mounted photo frames with free high-strength nano mounting tape.'
  },
  {
    id: 'prod-notebook',
    name: 'Personalized Wirebound Notebooks',
    basePrice: 79,
    category: 'Stationery',
    imageUrl: '/nbcover.jpg',
    description: 'Custom laminated softbound & hardbound loopwire spiral journals, student notebooks, and corporate planners.'
  },
  {
    id: 'prod-magnet',
    name: 'Customized Ref Magnets',
    basePrice: 25,
    category: 'Souvenirs & Gifts',
    imageUrl: '/magnet1.jpg',
    description: 'Glossy laminated magnetic souvenirs for birthdays, weddings, events, and business cards with strong magnetic backing.'
  },
  {
    id: 'prod-photo',
    name: 'Rush Photo Printing',
    basePrice: 15,
    category: 'Photo & ID',
    imageUrl: '/colored.jpg',
    description: 'Studio-grade glossy and satin photographic prints from wallet size, 3R, 4R, 5R, up to full A4 format.'
  },
  {
    id: 'prod-id',
    name: 'Rush ID Picture Packages',
    basePrice: 35,
    category: 'Photo & ID',
    imageUrl: '/idpic.jpg',
    description: 'Instant official 1x1, 2x2, Passport size, and Board Exam combo packages with professional digital background and collar edit.'
  },
  {
    id: 'prod-doc',
    name: 'Document Printing & Lamination',
    basePrice: 7,
    category: 'Print Services',
    imageUrl: '/bw.jpg',
    description: 'High-speed black & white and colored laser document printing, legal / A4 document binding, and hot thermal lamination.'
  },
  {
    id: 'prod-calendar',
    name: 'Customized Desk & Wall Calendars',
    basePrice: 150,
    category: 'Stationery',
    imageUrl: '/Calendar.png',
    description: 'Personalized 12-month double-loopwire desk flip calendars and single-sheet corporate wall calendars with vivid graphics.'
  },
  {
    id: 'prod-jacket',
    name: 'Customized Hoodies & Jackets',
    basePrice: 500,
    category: 'Apparel',
    imageUrl: '/tshirtcover.jpg',
    description: 'Warm premium fleece zip-up hoodies and pullover jackets customized with your front and back logo prints.'
  },
  {
    id: 'prod-tumbler',
    name: 'Customized Drink Tumblers & Flasks',
    basePrice: 180,
    category: 'Drinkware',
    imageUrl: '/mug1.jpg',
    description: 'Insulated double-wall acrylic tumblers and smart LED temperature display stainless steel vacuum flasks.'
  },
  {
    id: 'prod-badge',
    name: 'Custom Button Pin & Mirror Badges',
    basePrice: 45,
    category: 'Souvenirs & Gifts',
    imageUrl: '/Souvenir1.jpg',
    description: 'Promotional circular glossy button pin badges, rear magnet badges, and compact pocket mirror badges.'
  }
];

export const PORTFOLIO: PortfolioItem[] = [
  {
    id: 'proj-lyceum',
    title: 'Lyceum Customized Notebooks Project',
    category: 'Academic',
    imageUrl: '/Lyceum.png',
    description:
      'Bulk order of high-grade bound spiral wire notebooks with customized matte-laminated covers for Lyceum students and faculty.',
  },
  {
    id: 'proj-island-gas',
    title: 'ISLAND GAS 2026 Calendar Project',
    category: 'Corporate',
    imageUrl: '/Calendar.png',
    description:
      'Custom double-loop wire bound multi-page calendars featuring high-contrast corporate identity graphics for ISLAND GAS year-end distribution.',
  },
  {
    id: 'proj-gwen-zamora',
    title: "Customized Shirts for Gwen Zamora's Business",
    category: 'Custom Apparel',
    imageUrl: '/Gwen.png',
    description:
      "Soft ring-spun cotton fabric customized t-shirts utilizing high-elastic stretchable DTF printing for Gwen Zamora's retail brand.",
  },
  {
    id: 'proj-doctors',
    title: 'Customized Notebooks for Doctors',
    category: 'Corporate',
    imageUrl: '/Doctors.jpg',
    description:
      'Elegantly finished custom journals featuring individual doctor name engravings and custom medicine prescription log page templates.',
  },
  {
    id: 'proj-accenture',
    title: 'Customized Jackets for Accenture Philippines',
    category: 'Custom Apparel',
    imageUrl: '/accenture.png',
    description:
      'High-density thermal film transfer customized hoodies and weather-resistant varsity jackets branded for Accenture internal corporate teams.',
  },
];

// Map products and portfolio dynamically to centralized ASSETS helper using real files
const PRODUCT_IMAGES: Record<string, string> = {
  'prod-tshirt': '/tshirtcover.jpg',
  'prod-mug': '/mug2.jpg',
  'prod-tote': '/totebag1.jpg',
  'prod-wallet': '/wallet 1.jpg',
  'prod-sintra': '/sintra1.jpg',
  'prod-notebook': '/nbcover.jpg',
  'prod-magnet': '/magnet1.jpg',
  'prod-photo': '/colored.jpg',
  'prod-id': '/idpic.jpg',
  'prod-doc': '/bw.jpg',
  'prod-calendar': '/Calendar.png',
  'prod-jacket': '/tshirtcover.jpg',
  'prod-tumbler': '/mug2.jpg',
  'prod-badge': '/Souvenir1.jpg'
};

PRODUCTS.forEach(p => {
  if (PRODUCT_IMAGES[p.id]) {
    p.imageUrl = PRODUCT_IMAGES[p.id];
  }
});

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'What services do you offer?',
    answer: 'We offer document printing, photo printing, ID photos, tarpaulin printing, sticker printing, invitations, customized shirts, and other printing-related services.'
  },
  {
    id: 'faq-2',
    question: 'How do I place an order?',
    answer: 'To place an order, simply click the Contact Us button and send us a message via Messenger. Provide your order details and files, and we will assist you right away.'
  },
  {
    id: 'faq-3',
    question: 'What file formats do you accept?',
    answer: 'We accept PDF, JPG, PNG, DOCX, and most common file formats suitable for printing.'
  },
  {
    id: 'faq-4',
    question: 'How long does order processing take?',
    answer: 'Processing time varies depending on the type, quantity, and complexity of the order. Simple printing jobs are usually completed within the same day.'
  },
  {
    id: 'faq-5',
    question: 'Do you require a down payment?',
    answer: 'Yes. A minimum down payment of 50% of the total order amount is required before production can begin. The remaining balance must be settled before delivery or pickup.'
  },
  {
    id: 'faq-6',
    question: 'Do you accept rush orders?',
    answer: 'Yes, rush orders are accepted subject to availability and workload. Additional charges may apply.'
  },
  {
    id: 'faq-7',
    question: 'Can I review my design before printing?',
    answer: 'Yes. A digital preview or layout will be provided for your approval before production begins.'
  },
  {
    id: 'faq-8',
    question: 'What payment methods do you accept?',
    answer: 'We accept GCash, bank transfers, and cash payments.'
  },
  {
    id: 'faq-9',
    question: 'Do you issue Official Receipts (OR)?',
    answer: 'As a home-based business, we currently do not issue Official Receipts (OR). However, we provide our own transaction receipt as proof of payment and order confirmation.'
  },
  {
    id: 'faq-10',
    question: 'Do you offer delivery or shipping?',
    answer: 'Yes. Delivery and shipping can be arranged; however, all shipping and delivery fees are the responsibility of the buyer unless otherwise agreed upon.'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    name: 'Krystel Gomez',
    role: 'Sari-Sari Store Owner',
    rating: 5,
    comment: 'The Sintra board photos are superb! High-gloss print, very lightweight, and stick-on tape was included. Perfect for wall decor.',
    date: '2026-07-10'
  },
  {
    id: 't-2',
    name: 'Mark Reyes',
    role: 'Local Event Organiser',
    rating: 5,
    comment: 'Ordered 50 customized mugs with boxes for my daughter\'s birthday party. Fast transaction, neat prints, and everyone loved them!',
    date: '2026-07-12'
  }
];

export const INITIAL_MATERIALS: MaterialEquipment[] = [
  {
    id: 'mat-1',
    name: '2pcs Epson L3210 Printer',
    quantity: '2 Units',
    contributions: 20000,
    contributor: 'Mark',
    date: '2026-05-09',
    type: 'Equipment'
  },
  {
    id: 'mat-2',
    name: 'Canon G4770',
    quantity: '1 Unit',
    contributions: 14000,
    contributor: 'Kaye & Jobelle',
    date: '2026-05-09',
    type: 'Equipment'
  },
  {
    id: 'mat-3',
    name: 'Epson L3250',
    quantity: '1 Unit',
    contributions: 13000,
    contributor: 'Kaye & Jobelle',
    date: '2026-05-09',
    type: 'Equipment'
  },
  {
    id: 'mat-4',
    name: 'Epson L3210',
    quantity: '1 Unit',
    contributions: 9000,
    contributor: 'Kaye & Jobelle',
    date: '2026-05-09',
    type: 'Equipment'
  },
  {
    id: 'mat-5',
    name: 'Heat Press',
    quantity: '1 Unit',
    contributions: 9045,
    contributor: 'Mark',
    date: '2026-05-09',
    type: 'Equipment'
  },
  {
    id: 'mat-6',
    name: 'Binding Machine',
    quantity: '1 Unit',
    contributions: 5000,
    contributor: 'Mark',
    date: '2026-05-10',
    type: 'Equipment'
  },
  {
    id: 'mat-7',
    name: 'Ream Cutter',
    quantity: '1 Unit',
    contributions: 3400,
    contributor: 'Mark',
    date: '2026-05-10',
    type: 'Equipment'
  },
  {
    id: 'mat-8',
    name: 'Badge Maker',
    quantity: '1 Unit',
    contributions: 2299,
    contributor: 'Kaye & Jobelle',
    date: '2026-05-10',
    type: 'Equipment'
  },
  {
    id: 'mat-9',
    name: 'Long Arm Stapler',
    quantity: '1 Unit',
    contributions: 1534,
    contributor: 'Kaye & Jobelle',
    date: '2026-05-10',
    type: 'Equipment'
  },
  {
    id: 'mat-10',
    name: 'Ink',
    quantity: '1 Batch',
    contributions: 8000,
    contributor: 'Kaye & Jobelle',
    date: '2026-05-10',
    type: 'Material'
  },
  {
    id: 'mat-11',
    name: 'Double Sided Photo Paper Glossy',
    quantity: '1 Batch',
    contributions: 3000,
    contributor: 'Kaye & Jobelle',
    date: '2026-05-10',
    type: 'Material'
  },
  {
    id: 'mat-12',
    name: 'Binding Machine',
    quantity: '1 Unit',
    contributions: 1500,
    contributor: 'Kaye & Jobelle',
    date: '2026-05-10',
    type: 'Equipment'
  },
  {
    id: 'mat-13',
    name: 'Shopee Orders',
    quantity: '1 Batch',
    contributions: 12500,
    contributor: 'Mark',
    date: '2026-05-17',
    type: 'Material'
  },
  {
    id: 'mat-14',
    name: 'Heavy Duty Corner Puncher',
    quantity: '1 Unit',
    contributions: 4258,
    contributor: 'Kaye & Jobelle',
    date: '2026-05-19',
    type: 'Equipment'
  }
];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'JKM-20260715-001',
    customerName: 'Zhaie',
    customerContact: '09170000001',
    date: '2026-06-25',
    time: '01:17 PM',
    items: [
      {
        id: 'ci-32',
        product: PRODUCTS[4],
        quantity: 5,
        subtotal: 300
      }
    ],
    subtotal: 300,
    discount: 0,
    grandTotal: 300,
    paymentType: 'Full Payment',
    paymentMethod: 'GCash',
    downPaymentAmount: 300,
    remainingBalance: 0,
    amountPaid: 300,
    change: 0,
    status: 'Pending',
    notes: 'Premium printing job'
  },
  {
    id: 'JKM-20260618-001',
    customerName: 'Kiera',
    date: '2026-06-18',
    time: '03:22 PM',
    items: [{ id: 'ci-31', product: PRODUCTS[0], quantity: 1, subtotal: 110 }],
    subtotal: 110,
    discount: 0,
    grandTotal: 110,
    paymentType: 'Full Payment',
    paymentMethod: 'Cash',
    downPaymentAmount: 110,
    remainingBalance: 0,
    amountPaid: 110,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260616-001',
    customerName: 'Sky Notebook',
    date: '2026-06-16',
    time: '12:03 PM',
    items: [{ id: 'ci-30', product: PRODUCTS[0], quantity: 1, subtotal: 560 }],
    subtotal: 560,
    discount: 0,
    grandTotal: 560,
    paymentType: 'Full Payment',
    paymentMethod: 'Cash',
    downPaymentAmount: 560,
    remainingBalance: 0,
    amountPaid: 560,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260615-001',
    customerName: 'Jhe PCG',
    date: '2026-06-15',
    time: '03:16 PM',
    items: [{ id: 'ci-29', product: PRODUCTS[0], quantity: 1, subtotal: 660 }],
    subtotal: 660,
    discount: 0,
    grandTotal: 660,
    paymentType: 'Full Payment',
    paymentMethod: 'GCash',
    downPaymentAmount: 660,
    remainingBalance: 0,
    amountPaid: 660,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260612-005',
    customerName: 'Abiezer & Chloe',
    date: '2026-06-12',
    time: '11:25 PM',
    items: [{ id: 'ci-28', product: PRODUCTS[0], quantity: 1, subtotal: 120 }],
    subtotal: 120,
    discount: 0,
    grandTotal: 120,
    paymentType: 'Full Payment',
    paymentMethod: 'Cash',
    downPaymentAmount: 120,
    remainingBalance: 0,
    amountPaid: 120,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260612-004',
    customerName: 'Jhe',
    date: '2026-06-12',
    time: '11:22 PM',
    items: [{ id: 'ci-27', product: PRODUCTS[0], quantity: 1, subtotal: 330 }],
    subtotal: 330,
    discount: 0,
    grandTotal: 330,
    paymentType: 'Full Payment',
    paymentMethod: 'Cash',
    downPaymentAmount: 330,
    remainingBalance: 0,
    amountPaid: 330,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260612-003',
    customerName: 'Miho',
    date: '2026-06-12',
    time: '11:18 PM',
    items: [{ id: 'ci-26', product: PRODUCTS[0], quantity: 1, subtotal: 280 }],
    subtotal: 280,
    discount: 0,
    grandTotal: 280,
    paymentType: 'Full Payment',
    paymentMethod: 'GCash',
    downPaymentAmount: 280,
    remainingBalance: 0,
    amountPaid: 280,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260612-002',
    customerName: 'Lara',
    date: '2026-06-12',
    time: '11:14 PM',
    items: [{ id: 'ci-25', product: PRODUCTS[0], quantity: 1, subtotal: 140 }],
    subtotal: 140,
    discount: 0,
    grandTotal: 140,
    paymentType: 'Full Payment',
    paymentMethod: 'Cash',
    downPaymentAmount: 140,
    remainingBalance: 0,
    amountPaid: 140,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260612-001',
    customerName: 'Karen',
    date: '2026-06-12',
    time: '11:03 PM',
    items: [{ id: 'ci-24', product: PRODUCTS[0], quantity: 1, subtotal: 360 }],
    subtotal: 360,
    discount: 0,
    grandTotal: 360,
    paymentType: 'Full Payment',
    paymentMethod: 'GCash',
    downPaymentAmount: 360,
    remainingBalance: 0,
    amountPaid: 360,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260610-006',
    customerName: 'Shammy',
    date: '2026-06-10',
    time: '12:23 PM',
    items: [{ id: 'ci-23', product: PRODUCTS[0], quantity: 1, subtotal: 560 }],
    subtotal: 560,
    discount: 0,
    grandTotal: 560,
    paymentType: 'Full Payment',
    paymentMethod: 'Cash',
    downPaymentAmount: 560,
    remainingBalance: 0,
    amountPaid: 560,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260610-005',
    customerName: 'Erika',
    date: '2026-06-10',
    time: '12:22 PM',
    items: [{ id: 'ci-22', product: PRODUCTS[0], quantity: 1, subtotal: 60 }],
    subtotal: 60,
    discount: 0,
    grandTotal: 60,
    paymentType: 'Full Payment',
    paymentMethod: 'Cash',
    downPaymentAmount: 60,
    remainingBalance: 0,
    amountPaid: 60,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260610-004',
    customerName: 'Karen',
    date: '2026-06-10',
    time: '12:20 PM',
    items: [{ id: 'ci-21', product: PRODUCTS[0], quantity: 1, subtotal: 350 }],
    subtotal: 350,
    discount: 0,
    grandTotal: 350,
    paymentType: 'Full Payment',
    paymentMethod: 'GCash',
    downPaymentAmount: 350,
    remainingBalance: 0,
    amountPaid: 350,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260610-003',
    customerName: 'Karen',
    date: '2026-06-10',
    time: '12:19 PM',
    items: [{ id: 'ci-20', product: PRODUCTS[0], quantity: 1, subtotal: 910 }],
    subtotal: 910,
    discount: 0,
    grandTotal: 910,
    paymentType: 'Full Payment',
    paymentMethod: 'GCash',
    downPaymentAmount: 910,
    remainingBalance: 0,
    amountPaid: 910,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260610-002',
    customerName: 'Gellie',
    date: '2026-06-10',
    time: '12:13 PM',
    items: [{ id: 'ci-19', product: PRODUCTS[0], quantity: 1, subtotal: 420 }],
    subtotal: 420,
    discount: 0,
    grandTotal: 420,
    paymentType: 'Full Payment',
    paymentMethod: 'Cash',
    downPaymentAmount: 420,
    remainingBalance: 0,
    amountPaid: 420,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260610-001',
    customerName: 'Lara',
    date: '2026-06-10',
    time: '12:12 PM',
    items: [{ id: 'ci-18', product: PRODUCTS[0], quantity: 1, subtotal: 350 }],
    subtotal: 350,
    discount: 0,
    grandTotal: 350,
    paymentType: 'Full Payment',
    paymentMethod: 'Cash',
    downPaymentAmount: 350,
    remainingBalance: 0,
    amountPaid: 350,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260601-001',
    customerName: 'SVR',
    date: '2026-06-01',
    time: '05:13 PM',
    items: [{ id: 'ci-17', product: PRODUCTS[0], quantity: 1, subtotal: 9420 }],
    subtotal: 9420,
    discount: 0,
    grandTotal: 9420,
    paymentType: 'Full Payment',
    paymentMethod: 'Bank Transfer',
    downPaymentAmount: 9420,
    remainingBalance: 0,
    amountPaid: 9420,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260530-001',
    customerName: 'Shiela',
    date: '2026-05-30',
    time: '11:16 AM',
    items: [{ id: 'ci-16', product: PRODUCTS[0], quantity: 1, subtotal: 1050 }],
    subtotal: 1050,
    discount: 0,
    grandTotal: 1050,
    paymentType: 'Full Payment',
    paymentMethod: 'GCash',
    downPaymentAmount: 1050,
    remainingBalance: 0,
    amountPaid: 1050,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260528-001',
    customerName: 'Jhulie Andrea',
    date: '2026-05-28',
    time: '02:46 PM',
    items: [{ id: 'ci-15', product: PRODUCTS[0], quantity: 1, subtotal: 1330 }],
    subtotal: 1330,
    discount: 0,
    grandTotal: 1330,
    paymentType: 'Full Payment',
    paymentMethod: 'Cash',
    downPaymentAmount: 1330,
    remainingBalance: 0,
    amountPaid: 1330,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260520-001',
    customerName: 'Leah',
    date: '2026-05-20',
    time: '07:08 PM',
    items: [{ id: 'ci-14', product: PRODUCTS[0], quantity: 1, subtotal: 250 }],
    subtotal: 250,
    discount: 0,
    grandTotal: 250,
    paymentType: 'Full Payment',
    paymentMethod: 'Cash',
    downPaymentAmount: 250,
    remainingBalance: 0,
    amountPaid: 250,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260519-013',
    customerName: 'Solomon',
    date: '2026-05-19',
    time: '10:22 PM',
    items: [{ id: 'ci-13', product: PRODUCTS[0], quantity: 1, subtotal: 4500 }],
    subtotal: 4500,
    discount: 0,
    grandTotal: 4500,
    paymentType: 'Full Payment',
    paymentMethod: 'GCash',
    downPaymentAmount: 4500,
    remainingBalance: 0,
    amountPaid: 4500,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260519-012',
    customerName: 'Nica/Joanna',
    date: '2026-05-19',
    time: '10:22 PM',
    items: [{ id: 'ci-12', product: PRODUCTS[0], quantity: 1, subtotal: 3300 }],
    subtotal: 3300,
    discount: 0,
    grandTotal: 3300,
    paymentType: 'Full Payment',
    paymentMethod: 'Cash',
    downPaymentAmount: 3300,
    remainingBalance: 0,
    amountPaid: 3300,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260519-011',
    customerName: 'PTC',
    date: '2026-05-19',
    time: '10:21 PM',
    items: [{ id: 'ci-11', product: PRODUCTS[0], quantity: 1, subtotal: 450 }],
    subtotal: 450,
    discount: 0,
    grandTotal: 450,
    paymentType: 'Full Payment',
    paymentMethod: 'Bank Transfer',
    downPaymentAmount: 450,
    remainingBalance: 0,
    amountPaid: 450,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260519-010',
    customerName: 'Imboy',
    date: '2026-05-19',
    time: '10:21 PM',
    items: [{ id: 'ci-10', product: PRODUCTS[0], quantity: 1, subtotal: 200 }],
    subtotal: 200,
    discount: 0,
    grandTotal: 200,
    paymentType: 'Full Payment',
    paymentMethod: 'Cash',
    downPaymentAmount: 200,
    remainingBalance: 0,
    amountPaid: 200,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260519-009',
    customerName: 'JohnV',
    date: '2026-05-19',
    time: '10:20 PM',
    items: [{ id: 'ci-9', product: PRODUCTS[0], quantity: 1, subtotal: 2040 }],
    subtotal: 2040,
    discount: 0,
    grandTotal: 2040,
    paymentType: 'Full Payment',
    paymentMethod: 'GCash',
    downPaymentAmount: 2040,
    remainingBalance: 0,
    amountPaid: 2040,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260519-008',
    customerName: 'Accenture',
    date: '2026-05-19',
    time: '10:18 PM',
    items: [{ id: 'ci-8', product: PRODUCTS[0], quantity: 1, subtotal: 9600 }],
    subtotal: 9600,
    discount: 0,
    grandTotal: 9600,
    paymentType: 'Full Payment',
    paymentMethod: 'GCash',
    downPaymentAmount: 9600,
    remainingBalance: 0,
    amountPaid: 9600,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260519-007',
    customerName: 'Ate C',
    date: '2026-05-19',
    time: '10:18 PM',
    items: [{ id: 'ci-7', product: PRODUCTS[0], quantity: 1, subtotal: 640 }],
    subtotal: 640,
    discount: 0,
    grandTotal: 640,
    paymentType: 'Full Payment',
    paymentMethod: 'Cash',
    downPaymentAmount: 640,
    remainingBalance: 0,
    amountPaid: 640,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260519-006',
    customerName: 'Karen',
    date: '2026-05-19',
    time: '10:17 PM',
    items: [{ id: 'ci-6', product: PRODUCTS[0], quantity: 1, subtotal: 960 }],
    subtotal: 960,
    discount: 0,
    grandTotal: 960,
    paymentType: 'Full Payment',
    paymentMethod: 'GCash',
    downPaymentAmount: 960,
    remainingBalance: 0,
    amountPaid: 960,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260519-005',
    customerName: 'Sanya',
    date: '2026-05-19',
    time: '10:16 PM',
    items: [{ id: 'ci-5', product: PRODUCTS[0], quantity: 1, subtotal: 2560 }],
    subtotal: 2560,
    discount: 0,
    grandTotal: 2560,
    paymentType: 'Full Payment',
    paymentMethod: 'GCash',
    downPaymentAmount: 2560,
    remainingBalance: 0,
    amountPaid: 2560,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260519-004',
    customerName: 'Sophia',
    date: '2026-05-19',
    time: '10:15 PM',
    items: [{ id: 'ci-4', product: PRODUCTS[0], quantity: 1, subtotal: 2240 }],
    subtotal: 2240,
    discount: 0,
    grandTotal: 2240,
    paymentType: 'Full Payment',
    paymentMethod: 'Cash',
    downPaymentAmount: 2240,
    remainingBalance: 0,
    amountPaid: 2240,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260519-003',
    customerName: 'Gwen Z',
    date: '2026-05-19',
    time: '10:14 PM',
    items: [{ id: 'ci-3', product: PRODUCTS[0], quantity: 1, subtotal: 3200 }],
    subtotal: 3200,
    discount: 0,
    grandTotal: 3200,
    paymentType: 'Full Payment',
    paymentMethod: 'GCash',
    downPaymentAmount: 3200,
    remainingBalance: 0,
    amountPaid: 3200,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260519-002',
    customerName: 'Ar-eem',
    date: '2026-05-19',
    time: '10:13 PM',
    items: [{ id: 'ci-2', product: PRODUCTS[0], quantity: 1, subtotal: 180 }],
    subtotal: 180,
    discount: 0,
    grandTotal: 180,
    paymentType: 'Full Payment',
    paymentMethod: 'Cash',
    downPaymentAmount: 180,
    remainingBalance: 0,
    amountPaid: 180,
    change: 0,
    status: 'Completed'
  },
  {
    id: 'JKM-20260519-001',
    customerName: 'Ar-eem',
    date: '2026-05-19',
    time: '10:12 PM',
    items: [{ id: 'ci-1', product: PRODUCTS[0], quantity: 1, subtotal: 2385 }],
    subtotal: 2385,
    discount: 0,
    grandTotal: 2385,
    paymentType: 'Full Payment',
    paymentMethod: 'GCash',
    downPaymentAmount: 2385,
    remainingBalance: 0,
    amountPaid: 2385,
    change: 0,
    status: 'Completed'
  }
];

export const TIMELINE_STEPS = [
  {
    number: '01',
    title: 'Consult & Select',
    description: 'Browse our extensive catalog or submit custom size requests for specialized products.'
  },
  {
    number: '02',
    title: 'Design Approval',
    description: 'Our specialists double-check image resolution, aspect ratios, and design dimensions.'
  },
  {
    number: '03',
    title: 'Downpayment Settle',
    description: 'Confirm booking via secure Cash, GCash, or Bank Transfer downpayment parameters.'
  },
  {
    number: '04',
    title: 'High-Fidelity Print',
    description: 'Our top-tier Epson/Canon inkjets and dual-bed heat presses manufacture your premium items.'
  },
  {
    number: '05',
    title: 'Store Pickup',
    description: 'Settle remaining balance and pick up your hand-crafted digital prints with full invoice.'
  }
];

export interface PreloadedMaterial {
  id: string;
  name: string;
  price: number;
  packaging: string;
  category: string;
  unit: string;
  stock: number;
  minThreshold: number;
}

export const PRELOADED_MATERIALS: PreloadedMaterial[] = [
  { id: 'mat-1', name: '11mm Loopwire', price: 290, packaging: '100 pcs per box', category: 'Spirals', unit: 'Boxes', stock: 50, minThreshold: 10 },
  { id: 'mat-2', name: 'Sublimation Mug', price: 35, packaging: '1 pc', category: 'Mugs', unit: 'Pieces', stock: 100, minThreshold: 15 },
  { id: 'mat-3', name: 'Sublimation Paper', price: 200, packaging: '100 sheets per pack', category: 'Papers', unit: 'Packs', stock: 30, minThreshold: 5 },
  { id: 'mat-4', name: 'Mug Box with Handle', price: 6, packaging: '1 pc', category: 'Packaging', unit: 'Pieces', stock: 100, minThreshold: 20 },
  { id: 'mat-5', name: 'Sublimation Mousepad', price: 30, packaging: '1 pc', category: 'Sublimation', unit: 'Pieces', stock: 50, minThreshold: 10 },
  { id: 'mat-6', name: 'Photo Sticker', price: 168, packaging: '50 sheets per pack', category: 'Stickers', unit: 'Packs', stock: 25, minThreshold: 5 },
  { id: 'mat-7', name: '3R Cuyi Photopaper', price: 33, packaging: '20 sheets per pack', category: 'Papers', unit: 'Packs', stock: 40, minThreshold: 10 },
  { id: 'mat-8', name: '4R Cuyi Photopaper', price: 40, packaging: '20 sheets per pack', category: 'Papers', unit: 'Packs', stock: 40, minThreshold: 10 },
  { id: 'mat-9', name: '5R Cuyi Photopaper', price: 59, packaging: '20 sheets per pack', category: 'Papers', unit: 'Packs', stock: 30, minThreshold: 8 },
  { id: 'mat-10', name: 'A4 Cuyi Photopaper', price: 132, packaging: '20 sheets per pack', category: 'Papers', unit: 'Packs', stock: 35, minThreshold: 10 },
  { id: 'mat-11', name: '150gsm Photopaper', price: 190, packaging: '100 sheets per pack', category: 'Papers', unit: 'Packs', stock: 20, minThreshold: 5 },
  { id: 'mat-12', name: '230gsm Photopaper', price: 49, packaging: '20 sheets per pack', category: 'Papers', unit: 'Packs', stock: 30, minThreshold: 8 },
  { id: 'mat-13', name: '160gsm Double-Sided Photopaper', price: 150, packaging: '100 sheets per pack', category: 'Papers', unit: 'Packs', stock: 25, minThreshold: 5 },
  { id: 'mat-14', name: '70gsm CopyOne A4 Bondpaper', price: 180, packaging: '500 sheets per ream', category: 'Papers', unit: 'Reams', stock: 15, minThreshold: 3 },
  { id: 'mat-15', name: 'A4 Sintraboard', price: 200, packaging: '10 pcs per pack', category: 'Boards', unit: 'Packs', stock: 20, minThreshold: 5 },
  { id: 'mat-16', name: 'A3 Sintraboard', price: 400, packaging: '10 pcs per pack', category: 'Boards', unit: 'Packs', stock: 15, minThreshold: 3 },
  { id: 'mat-17', name: 'Glitters Phototop', price: 123, packaging: '20 sheets per pack', category: 'Phototops', unit: 'Packs', stock: 25, minThreshold: 5 },
  { id: 'mat-18', name: 'Leather Phototop', price: 99, packaging: '20 sheets per pack', category: 'Phototops', unit: 'Packs', stock: 25, minThreshold: 5 },
  { id: 'mat-19', name: 'Matte Phototop', price: 120, packaging: '20 sheets per pack', category: 'Phototops', unit: 'Packs', stock: 30, minThreshold: 5 },
  { id: 'mat-20', name: 'Glossy Phototop', price: 85, packaging: '20 sheets per pack', category: 'Phototops', unit: 'Packs', stock: 35, minThreshold: 8 },
  { id: 'mat-21', name: 'OPP Plastic', price: 100, packaging: '100 pcs per pack', category: 'Packaging', unit: 'Packs', stock: 50, minThreshold: 10 },
  { id: 'mat-22', name: '80 Microns Laminating Film', price: 240, packaging: '100 sheets per pack', category: 'Films', unit: 'Packs', stock: 20, minThreshold: 5 },
  { id: 'mat-23', name: 'Metal Corner', price: 120, packaging: '100 pcs per pack', category: 'Accessories', unit: 'Packs', stock: 15, minThreshold: 5 },
  { id: 'mat-24', name: 'Ball Chain', price: 90, packaging: '100 pcs per pack', category: 'Accessories', unit: 'Packs', stock: 20, minThreshold: 5 },
  { id: 'mat-25', name: 'Foldcote', price: 180, packaging: '25 pcs per pack', category: 'Papers', unit: 'Packs', stock: 15, minThreshold: 3 },
  { id: 'mat-26', name: 'Thank You Plastic', price: 280, packaging: '100 pcs per pack', category: 'Packaging', unit: 'Packs', stock: 30, minThreshold: 5 },
  { id: 'mat-27', name: 'Epson Ink CMYK', price: 420, packaging: '1 set', category: 'Inks', unit: 'Sets', stock: 10, minThreshold: 2 },
  { id: 'mat-28', name: 'Canon Ink CMYK', price: 550, packaging: '1 set', category: 'Inks', unit: 'Sets', stock: 8, minThreshold: 2 }
];

export const DEFAULT_REELS = [
  { id: '1499561185538757', title: "Premium Custom Mug Printing", facebookUrl: "https://www.facebook.com/reel/1499561185538757" },
  { id: '1741909163830480', title: "Vibrant DTF Apparel Transfers", facebookUrl: "https://www.facebook.com/reel/1741909163830480" },
  { id: '3171837153012266', title: "Precision Cover Binding", facebookUrl: "https://www.facebook.com/reel/3171837153012266" },
  { id: '2422475104927696', title: "Corporate Magic Mug Reveals", facebookUrl: "https://www.facebook.com/reel/2422475104927696" },
  { id: '1406954744795501', title: "High-Fidelity Canvas Prints", facebookUrl: "https://www.facebook.com/reel/1406954744795501" },
  { id: '935278869260662', title: "Precision Cut Vinyl Stickers", facebookUrl: "https://www.facebook.com/reel/935278869260662" },
  { id: '1563576934736142', title: "Custom Academic Planner Binding", facebookUrl: "https://www.facebook.com/reel/1563576934736142" },
  { id: '974841671728566', title: "Full Sublimation Sports Jerseys", facebookUrl: "https://www.facebook.com/reel/974841671728566" },
  { id: '954154157103431', title: "Quality Control & Packaging", facebookUrl: "https://www.facebook.com/reel/954154157103431" }
];
