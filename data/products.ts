import { Product } from '../src/types';

export const PRODUCTS: Product[] = [
  {
    id: 'aero-sonic-pro',
    name: 'AeroSonic Carbon ANC',
    tagline: 'Precision Acoustic Engineering',
    category: 'Tech',
    subCategory: 'Audio',
    price: 349,
    originalPrice: 399,
    rating: 4.9,
    reviewsCount: 382,
    badge: 'Flagship',
    description: 'Custom 45mm beryllium drivers with real-time neural noise cancellation, 42-hour lossless playback, and ultra-low latency spatial audio.',
    stock: 24,
    inStock: true,
    weightKg: 0.28,
    images: {
      high: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
      medium: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=70',
      low: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=50',
      placeholder: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=60&q=20',
    },
    gallery: [
      {
        high: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=60&q=20',
        caption: 'Studio Profile'
      },
      {
        high: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=60&q=20',
        caption: 'Acoustic Driver Chamber'
      },
      {
        high: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=60&q=20',
        caption: 'Magnetic Hardcase'
      }
    ],
    specs: {
      'Driver Size': '45mm Beryllium',
      'Battery Life': '42 hours',
      'Connectivity': 'Bluetooth 5.4 / USB-C Lossless',
      'Noise Cancellation': 'Hybrid ANC (-45dB)',
      'Weight': '280g'
    },
    features: [
      'Adaptive Acoustic Calibration',
      'Lossless 24-bit/96kHz Audio',
      'Aircraft-grade milled aluminum chassis',
      'Multi-point device switching'
    ]
  },
  {
    id: 'lumix-chrono-v2',
    name: 'Lumix Chrono Titanium',
    tagline: 'Titanium Biometric Sentinel',
    category: 'Lifestyle',
    subCategory: 'Wearables',
    price: 499,
    originalPrice: 549,
    rating: 4.8,
    reviewsCount: 219,
    badge: 'Popular',
    description: 'Grade 5 titanium aerospace body with micro-LED 1800-nit display, continuous ECG/VO2 max tracking, and 14-day expedition battery reserve.',
    stock: 18,
    inStock: true,
    weightKg: 0.052,
    images: {
      high: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85',
      medium: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=70',
      low: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=50',
      placeholder: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=60&q=20',
    },
    gallery: [
      {
        high: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=60&q=20',
        caption: 'Titanium Bezel'
      },
      {
        high: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=60&q=20',
        caption: 'Macro Crystal Dial'
      },
      {
        high: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=60&q=20',
        caption: 'Biometric Optical Array'
      }
    ],
    specs: {
      'Case Material': 'Grade 5 Aerospace Titanium',
      'Display': '1.43" AMOLED 1800 nits',
      'Water Resistance': '10 ATM (100m)',
      'Sensors': 'ECG, SpO2, Optical PPG, Barometer',
      'Battery': 'Up to 14 days'
    },
    features: [
      'Dual-frequency Multi-GNSS satellite tracking',
      'Sapphire crystal glass screen',
      'Sub-zero expedition temperature tolerance',
      'Wireless fast induction charging'
    ]
  },
  {
    id: 'pulsecore-matrix-65',
    name: 'PulseCore Matrix 65',
    tagline: 'Custom Mechanical Instrument',
    category: 'Tech',
    subCategory: 'Workspace',
    price: 229,
    rating: 4.9,
    reviewsCount: 512,
    badge: 'Top Rated',
    description: 'Gasket-mounted CNC anodized aluminum mechanical keyboard with hot-swappable tactile switches, per-key RGB, and custom brass sound dampener.',
    stock: 35,
    inStock: true,
    weightKg: 1.15,
    images: {
      high: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85',
      medium: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=70',
      low: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=300&q=50',
      placeholder: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=60&q=20',
    },
    gallery: [
      {
        high: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=60&q=20',
        caption: 'Top Keycap Layout'
      },
      {
        high: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=60&q=20',
        caption: 'Tactile Switch Cluster'
      },
      {
        high: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=60&q=20',
        caption: 'Side Incline & Weight'
      }
    ],
    specs: {
      'Layout': '65% Compact (67 Keys)',
      'Mounting': 'Poron Gasket Isolation',
      'Switches': 'Pulse Tactile 58g Pre-lubed',
      'Polling Rate': '1000Hz wired / 2.4GHz wireless',
      'Weight': '1150g'
    },
    features: [
      'Solid brass internal weight bar',
      'Double-shot PBT cherry profile keycaps',
      'QMK / VIA programmable firmware',
      '4000mAh battery for 200 hours untethered'
    ]
  },
  {
    id: 'hyper-vision-4k',
    name: 'HyperVision 32" OLED Studio',
    tagline: 'True-Color Reference Monitor',
    category: 'Tech',
    subCategory: 'Vision',
    price: 1199,
    originalPrice: 1399,
    rating: 4.7,
    reviewsCount: 94,
    badge: 'Professional',
    description: 'Quantum Dot OLED 4K display with 99.8% DCI-P3 color gamut, hardware calibration LUT, 96W single-cable USB-C delivery, and anti-glare etching.',
    stock: 9,
    inStock: true,
    weightKg: 7.2,
    images: {
      high: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=85',
      medium: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=70',
      low: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=300&q=50',
      placeholder: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=60&q=20',
    },
    gallery: [
      {
        high: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=60&q=20',
        caption: 'Full Bezel-less Display'
      },
      {
        high: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=60&q=20',
        caption: 'Color Reference Workspace'
      }
    ],
    specs: {
      'Panel Type': 'QD-OLED 10-bit Panel',
      'Resolution': '3840 x 2160 (4K UHD)',
      'Refresh Rate': '144Hz with G-Sync Compatible',
      'Peak Brightness': '1000 nits (HDR)',
      'Color Gamut': '99.8% DCI-P3 / 100% sRGB'
    },
    features: [
      'Built-in colorimeter motorized calibration',
      '96W Power Delivery via Thunderbolt 4',
      'Integrated KVM switch for dual workstations',
      'Pixel-shift burn-in preservation algorithm'
    ]
  },
  {
    id: 'veloce-carbon-ebike',
    name: 'Veloce Apex Carbon Commuter',
    tagline: 'Ultralight Urban Transit',
    category: 'Lifestyle',
    subCategory: 'Mobility',
    price: 2750,
    rating: 4.9,
    reviewsCount: 67,
    badge: 'Engineering Award',
    description: 'Monocoque Toray T800 carbon fiber frame weighing just 12.8kg. Smart torque sensor motor with hidden 360Wh battery delivering 80km range.',
    stock: 5,
    inStock: true,
    weightKg: 12.8,
    images: {
      high: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=85',
      medium: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=70',
      low: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=300&q=50',
      placeholder: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=60&q=20',
    },
    gallery: [
      {
        high: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=60&q=20',
        caption: 'Full Carbon Monocoque Frame'
      },
      {
        high: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=60&q=20',
        caption: 'Gates Belt Drive'
      }
    ],
    specs: {
      'Frame': 'Toray T800 Monocoque Carbon',
      'Total Weight': '12.8 kg (including battery)',
      'Motor': '250W Mivice Torque-Sensor Hub',
      'Range': 'Up to 80 km on single charge',
      'Brakes': 'Hydraulic 4-piston disc brakes'
    },
    features: [
      'Gates Carbon Drive CDX belt (no greasy chain)',
      'Integrated GPS tracking with cellular anti-theft',
      'Concealed frame cabling and integrated cockpit lights',
      'Removable seatpost battery pack'
    ]
  },
  {
    id: 'nomad-ultra-pack',
    name: 'Nomad Tech Modular Backpack',
    tagline: 'Ballistic Cordura Travel Pack',
    category: 'Lifestyle',
    subCategory: 'Gear',
    price: 189,
    rating: 4.8,
    reviewsCount: 420,
    badge: 'Commuter Pick',
    description: 'Weatherproof 840D recycled nylon commuter pack with magnetic Fidlock closures, suspended 16" laptop vault, and quick-access tech organizer.',
    stock: 45,
    inStock: true,
    weightKg: 0.95,
    images: {
      high: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85',
      medium: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=70',
      low: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=300&q=50',
      placeholder: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=60&q=20',
    },
    gallery: [
      {
        high: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=60&q=20',
        caption: 'Cordura Exterior'
      },
      {
        high: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=60&q=20',
        caption: 'Suspended Laptop Vault'
      }
    ],
    specs: {
      'Capacity': '24 Liters (expandable to 28L)',
      'Material': '840D Ballistic Cordura Eco-Nylon',
      'Laptop Compartment': 'Suspended up to 16" MacBook Pro',
      'Zippers': 'YKK AquaGuard Weatherproof',
      'Dimensions': '48 x 30 x 18 cm'
    },
    features: [
      'Magnetic German Fidlock sternum strap',
      'Luggage pass-through channel for rolling luggage',
      'RFID-blocking passport security pocket',
      'Breathable contoured EVA foam back panel'
    ]
  },
  {
    id: 'lumix-optix-pro',
    name: 'Lumix Optix 35mm Prime Camera',
    tagline: 'Full-Frame Rangefinder Instrument',
    category: 'Tech',
    subCategory: 'Photography',
    price: 1850,
    originalPrice: 1999,
    rating: 4.9,
    reviewsCount: 128,
    badge: 'Creator Choice',
    description: '48MP BSI full-frame sensor housed in magnesium alloy with mechanical brass exposure dials, hybrid optical/electronic viewfinder, and leaf shutter.',
    stock: 12,
    inStock: true,
    weightKg: 0.54,
    images: {
      high: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85',
      medium: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=70',
      low: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=50',
      placeholder: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=60&q=20',
    },
    gallery: [
      {
        high: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=60&q=20',
        caption: 'Rangefinder Body'
      },
      {
        high: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=60&q=20',
        caption: 'Aspherical F/1.4 Lens Element'
      }
    ],
    specs: {
      'Sensor': '48MP Full-Frame BSI CMOS',
      'Lens': 'Fixed 35mm f/1.4 Aspherical',
      'Shutter': 'Leaf shutter up to 1/4000s sync',
      'Video': '4K 60p 10-bit ProRes internal',
      'Storage': 'Internal 1TB High-speed SSD'
    },
    features: [
      'Tactile analog mechanical dials',
      'Monochrome and film simulation engine',
      'Ultra-compact magnesium alloy weather sealing',
      'USB-C tethered high-speed raw ingest'
    ]
  },
  {
    id: 'aether-spatial-speaker',
    name: 'Aether Acoustic Sphere',
    tagline: '360° Spatial Resonance Dome',
    category: 'Home',
    subCategory: 'Audio',
    price: 420,
    rating: 4.8,
    reviewsCount: 156,
    badge: 'Acoustic Masterpiece',
    description: 'Hand-turned walnut base with cylindrical aluminum acoustic wave guide. Features dual opposing force-cancelling subwoofers and RoomSense calibration.',
    stock: 16,
    inStock: true,
    weightKg: 3.4,
    images: {
      high: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=85',
      medium: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=70',
      low: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=300&q=50',
      placeholder: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=60&q=20',
    },
    gallery: [
      {
        high: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=60&q=20',
        caption: 'Acoustic Waveguide'
      },
      {
        high: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=60&q=20',
        caption: 'Walnut Acoustic Base'
      }
    ],
    specs: {
      'Output Power': '120W RMS Bi-amplified',
      'Drivers': 'Two 4" Woofers + Three 1" Silk Tweeters',
      'Streaming': 'AirPlay 2, Spotify Connect, Roon Ready',
      'Room Sensing': 'Mic-array continuous acoustic calibration',
      'Dimensions': '220 x 220 x 260 mm'
    },
    features: [
      'Force-cancelling dual subwoofers eliminate cabinet vibration',
      'Solid CNC-milled walnut and bead-blasted aluminum',
      'Lossless 24-bit/192kHz Wi-Fi streaming',
      'Proximity sensor capacitive volume halo'
    ]
  },
  {
    id: 'horizon-ar-glasses',
    name: 'Horizon Spatial AR Display',
    tagline: 'Micro-OLED Spatial Computing Eyewear',
    category: 'Tech',
    subCategory: 'Vision',
    price: 699,
    originalPrice: 799,
    rating: 4.6,
    reviewsCount: 89,
    badge: 'Next-Gen',
    description: 'Featherweight 74g spatial eyewear projecting a virtual 140-inch micro-OLED 120Hz display with electrochromic dimming lenses.',
    stock: 14,
    inStock: true,
    weightKg: 0.074,
    images: {
      high: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1200&q=85',
      medium: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=70',
      low: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=300&q=50',
      placeholder: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=60&q=20',
    },
    gallery: [
      {
        high: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=60&q=20',
        caption: 'Spatial Frame Architecture'
      },
      {
        high: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=60&q=20',
        caption: 'Electrochromic Smart Lens'
      }
    ],
    specs: {
      'Display Engine': 'Sony Dual 0.55" Micro-OLED',
      'Virtual Screen': '140" at 4 meters (52 PPD)',
      'Refresh Rate': '120Hz Low-Persistence',
      'Connectivity': 'USB-C DisplayPort Alternate Mode',
      'Weight': '74 grams'
    },
    features: [
      '3-DoF spatial tracking for fixed virtual windows',
      'Directional acoustic temple speakers with zero audio leak',
      'Magnetic snap-on prescription lens insert',
      'Electronic tinting lens button (0% to 99% light blocking)'
    ]
  },
  {
    id: 'onyx-precision-mouse',
    name: 'Onyx Ergonomic Pointer',
    tagline: 'Custom Magnesium Alloy Mouse',
    category: 'Tech',
    subCategory: 'Workspace',
    price: 159,
    rating: 4.8,
    reviewsCount: 310,
    badge: 'Popular',
    description: 'Perforated magnesium exoskeleton weighing just 48 grams. PixArt 3395 26,000 DPI optical sensor with Nordic 4000Hz polling rate microcontroller.',
    stock: 28,
    inStock: true,
    weightKg: 0.048,
    images: {
      high: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1200&q=85',
      medium: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=70',
      low: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=300&q=50',
      placeholder: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=60&q=20',
    },
    gallery: [
      {
        high: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=60&q=20',
        caption: 'Magnesium Alloy Exoskeleton'
      },
      {
        high: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=60&q=20',
        caption: 'PTFE Glide Feet & Sensor'
      }
    ],
    specs: {
      'Sensor': 'PixArt PAW3395 (26,000 DPI)',
      'Polling Rate': '4000Hz Wireless (0.25ms response)',
      'Switches': 'Optical Kailh GM 8.0 (90M clicks)',
      'Battery': '300mAh for 80 hours at 1000Hz',
      'Weight': '48g'
    },
    features: [
      'Pure PTFE zero-friction curved skates',
      'Nordic 52840 flagship wireless MCU',
      'Web-based driver configuration (no bloated software)',
      'Includes Paracord charging cable'
    ]
  },
  {
    id: 'studio-one-dac',
    name: 'StudioOne Reference HiFi DAC',
    tagline: 'Balanced Quad-DAC Audio Converter',
    category: 'Tech',
    subCategory: 'Audio',
    price: 580,
    rating: 4.9,
    reviewsCount: 97,
    badge: 'Audiophile',
    description: 'Dual ESS Sabre ES9038PRO reference DAC chips with balanced 4.4mm Pentaconn output and toroidal analog power supply stage.',
    stock: 11,
    inStock: true,
    weightKg: 1.8,
    images: {
      high: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=1200&q=85',
      medium: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=600&q=70',
      low: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=300&q=50',
      placeholder: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=60&q=20',
    },
    gallery: [
      {
        high: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=60&q=20',
        caption: 'Milled Aluminum Faceplate'
      },
      {
        high: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=60&q=20',
        caption: 'Analog Circuit Topology'
      }
    ],
    specs: {
      'DAC Chipset': 'Dual ESS Sabre ES9038PRO',
      'Resolution': '32-bit / 768kHz PCM & Native DSD512',
      'Dynamic Range': '132dB (A-weighted)',
      'Headphone Out': 'XLR 4-pin, 4.4mm Balanced, 6.35mm SE',
      'THD+N': '< 0.00008%'
    },
    features: [
      'Discrete Class-A balanced amplifier output stage',
      'Custom FPGA clock synchronizer with femtosecond oscillators',
      'OLED sample rate and bitrate status monitor',
      'Linear ultra-low noise internal toroidal power supply'
    ]
  },
  {
    id: 'solis-satellite-radio',
    name: 'Solis Rugged Satellite Transceiver',
    tagline: 'Solar Global Off-Grid Communicator',
    category: 'Lifestyle',
    subCategory: 'Expedition',
    price: 299,
    rating: 4.7,
    reviewsCount: 73,
    badge: 'Expedition',
    description: 'Two-way satellite messenger with integrated high-efficiency solar panel, emergency SOS beacon, and IP68 waterproof shockproof casing.',
    stock: 20,
    inStock: true,
    weightKg: 0.22,
    images: {
      high: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=85',
      medium: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=70',
      low: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=50',
      placeholder: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=60&q=20',
    },
    gallery: [
      {
        high: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=60&q=20',
        caption: 'Shockproof Armored Exterior'
      },
      {
        high: 'https://images.unsplash.com/photo-1507034589631-9433cc6bc453?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1507034589631-9433cc6bc453?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1507034589631-9433cc6bc453?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1507034589631-9433cc6bc453?auto=format&fit=crop&w=60&q=20',
        caption: 'Solar Backplate'
      }
    ],
    specs: {
      'Constellation': 'Iridium 100% Global Coverage',
      'Solar Panel': 'SunPower Maxeon 24% Efficiency',
      'Battery': '5000mAh (up to 30 days active tracking)',
      'Ingress Protection': 'IP68 Submersible (2m for 1 hour)',
      'Drop Rating': 'MIL-STD-810H (2 meter drop on concrete)'
    },
    features: [
      'Interactive 2-way satellite messaging without cellular coverage',
      'Dedicated covered SOS button with 24/7 rescue coordination',
      'Reverse wireless charging output for emergency phone boost',
      'Topographic map caching for offline trail guidance'
    ]
  },
  {
    id: 'zenith-sky-drone',
    name: 'Zenith Sky Cinema 8K Drone',
    tagline: 'Tri-Camera Hasselblad Aerial System',
    category: 'Tech',
    subCategory: 'Photography',
    price: 2199,
    originalPrice: 2399,
    rating: 4.9,
    reviewsCount: 142,
    badge: 'Flagship',
    description: 'Triple-camera aerial platform with 4/3 CMOS Hasselblad sensor, 8K 60fps ProRes recording, 46-minute endurance, and 360-degree APAS 5.0 collision avoidance.',
    stock: 8,
    inStock: true,
    weightKg: 0.895,
    images: {
      high: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1200&q=85',
      medium: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=600&q=70',
      low: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=300&q=50',
      placeholder: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=60&q=20',
    },
    gallery: [
      {
        high: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=60&q=20',
        caption: 'Aerial Carbon Airframe'
      },
      {
        high: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=60&q=20',
        caption: 'Hasselblad Tri-Lens Gimbal'
      }
    ],
    specs: {
      'Main Sensor': '20MP 4/3 CMOS Hasselblad',
      'Video Resolution': '8K at 60fps / 4K at 120fps ProRes HQ',
      'Max Flight Time': '46 minutes (no wind)',
      'Transmission Range': '15 km 1080p/60fps O3+ Live Feed',
      'Internal Storage': '1TB NVMe Solid State Storage'
    },
    features: [
      'Omnidirectional binocular vision obstacle sensing',
      '10-bit D-Log M color profile with natural color solution',
      'Night-mode noise reduction for low-light cinematic shots',
      'Automated dynamic waypoint flight planning'
    ]
  },
  {
    id: 'chrono-pulse-ring',
    name: 'ChronoPulse Titanium Smart Ring',
    tagline: 'Ultra-Discreet Circadian Bio-Tracker',
    category: 'Lifestyle',
    subCategory: 'Wearables',
    price: 299,
    originalPrice: 349,
    rating: 4.8,
    reviewsCount: 284,
    badge: 'Popular',
    description: 'Ultralight 3.8g Grade 5 titanium bio-tracker with research-grade photoplethysmography sensors, sleep stage architecture analysis, and temperature trend tracking.',
    stock: 22,
    inStock: true,
    weightKg: 0.0038,
    images: {
      high: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85',
      medium: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=70',
      low: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=300&q=50',
      placeholder: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=60&q=20',
    },
    gallery: [
      {
        high: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=60&q=20',
        caption: 'Titanium Matte Finish'
      },
      {
        high: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=60&q=20',
        caption: 'Interior PPG Sensor Ring'
      }
    ],
    specs: {
      'Shell': 'Grade 5 Aerospace Titanium with DLC Coating',
      'Weight': '3.8 grams (size 10)',
      'Water Resistance': '100m (10 ATM waterproof)',
      'Sensors': 'Green/Red/Infrared PPG, Negative Temp Thermistor',
      'Battery': '7 days continuous monitoring'
    },
    features: [
      'Zero screen distraction — ambient wireless sync',
      'Circadian recovery score and HRV variability metrics',
      'Continuous blood oxygen (SpO2) and skin temperature trend',
      'Includes brushed magnetic puck charging stand'
    ]
  },
  {
    id: 'vertex-ergostand-desk',
    name: 'Vertex ErgoDesk Solid Walnut',
    tagline: 'Dual-Motor Acoustic Standing Console',
    category: 'Home',
    subCategory: 'Workspace',
    price: 890,
    originalPrice: 990,
    rating: 4.9,
    reviewsCount: 215,
    badge: 'Top Rated',
    description: 'Sustainably harvested American black walnut desktop with concealed dual Bosch whisper-drive lifting columns, magnetic cable management, and OLED height preset controller.',
    stock: 7,
    inStock: true,
    weightKg: 42.5,
    images: {
      high: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=1200&q=85',
      medium: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=600&q=70',
      low: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=300&q=50',
      placeholder: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=60&q=20',
    },
    gallery: [
      {
        high: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=60&q=20',
        caption: 'Solid Walnut Surface'
      },
      {
        high: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=60&q=20',
        caption: 'Integrated Steel Lifting Frame'
      }
    ],
    specs: {
      'Top Dimensions': '160 cm x 80 cm x 3.2 cm Solid Walnut',
      'Height Range': '62 cm to 128 cm (continuous)',
      'Motors': 'Dual Bosch Whisper Drives (<38 dB noise level)',
      'Lifting Capacity': '140 kg (308 lbs)',
      'Controller': 'Flush OLED display with 4 memory presets'
    },
    features: [
      'Gyroscope anti-collision auto-reversing safety sensor',
      'Concealed underside magnetic spine for clean cable routing',
      'Continuous bevel edge for ergonomic wrist comfort',
      'Integrated Qi2 15W wireless phone charging hotspot'
    ]
  },
  {
    id: 'aura-ambient-purifier',
    name: 'Aura Atmospheric HEPA-14 Purifier',
    tagline: 'Precision Laser Particle Air Sanitizer',
    category: 'Home',
    subCategory: 'Smart Home',
    price: 380,
    originalPrice: 420,
    rating: 4.8,
    reviewsCount: 168,
    badge: 'Eco Pick',
    description: 'Anodized cylindrical tower featuring medical-grade True HEPA-14, activated coconut carbon pellet matrix, laser air quality particle sensor, and whisper 18dB night mode.',
    stock: 19,
    inStock: true,
    weightKg: 5.6,
    images: {
      high: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=1200&q=85',
      medium: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=70',
      low: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=50',
      placeholder: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=60&q=20',
    },
    gallery: [
      {
        high: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=60&q=20',
        caption: 'Anodized Perforated Cylinder'
      },
      {
        high: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1200&q=85',
        medium: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=70',
        low: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=300&q=50',
        placeholder: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=60&q=20',
        caption: 'Ambient Particle Glow Halo'
      }
    ],
    specs: {
      'Filtration': '3-Stage True HEPA-14 (99.995% at 0.1μm)',
      'Clean Air Delivery (CADR)': '480 m³/h (covers up to 65 m²)',
      'Sensors': 'Dual-laser optical PM2.5 + VOC semiconductor',
      'Noise Level': '18 dB (Sleep mode) to 48 dB (Turbo)',
      'Connectivity': 'Matter / Thread & Wi-Fi 6'
    },
    features: [
      'Medical-grade filtration captures ultrafine viral & smoke particles',
      'Color-changing atmospheric LED ring mirrors indoor air purity',
      'Automated smart fan speed ramp based on particle spikes',
      'Washable micro-mesh pre-filter prolongs core filter life to 14 months'
    ]
  }
];

export const CATEGORIES = [
  'All',
  'Tech',
  'Home',
  'Lifestyle',
] as const;

export const SUBCATEGORIES = [
  'All',
  'Audio',
  'Wearables',
  'Workspace',
  'Mobility',
  'Vision',
  'Photography',
  'Smart Home',
  'Gear',
] as const;
