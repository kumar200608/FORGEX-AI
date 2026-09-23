import { Product } from "../types";

const RAW_PRODUCTS: Product[] = [
  {
    "id": "aero-sonic-pro",
    "name": "AeroSonic Carbon ANC Headphones",
    "brand": "AeroSonic",
    "tagline": "Precision Acoustic Engineering with Active Noise Cancellation",
    "category": "Tech",
    "subCategory": "Audio",
    "price": 28999,
    "originalPrice": 34999,
    "discountPercent": 17,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 382,
    "badge": "Flagship",
    "description": "Custom 45mm beryllium drivers with real-time neural noise cancellation, 42-hour lossless playback, and ultra-low latency spatial audio.",
    "stock": 24,
    "inStock": true,
    "weightKg": 0.28,
    "variants": [
      {
        "id": "v-carbon-black",
        "name": "Carbon Black",
        "colorHex": "#18181b",
        "inStock": true
      },
      {
        "id": "v-arctic-silver",
        "name": "Arctic Silver",
        "colorHex": "#e4e4e7",
        "inStock": true
      },
      {
        "id": "v-navy-gold",
        "name": "Navy & Gold",
        "colorHex": "#1e293b",
        "inStock": true
      }
    ],
    "images": {
      "high": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Driver Size": "45mm Beryllium Diamond-coated",
      "Battery Life": "42 hours continuous ANC",
      "Connectivity": "Bluetooth 5.4 / USB-C Lossless 24-bit",
      "Noise Cancellation": "Hybrid Adaptive ANC (-45dB)",
      "Weight": "280g Aircraft Aluminium"
    },
    "features": [
      "Adaptive Acoustic Calibration tailored to ear canal shape",
      "Lossless 24-bit/96kHz Hi-Res wireless audio over LDAC",
      "Aircraft-grade milled aluminum chassis with memory-foam earcups",
      "Fast charge: 10 mins gives 6 hours playback"
    ]
  },
  {
    "id": "chronos-vanguard",
    "name": "Chronos Vanguard Titanium Smartwatch",
    "brand": "Chronos",
    "tagline": "Dual-Frequency GPS Titanium Multisport Watch",
    "category": "Lifestyle",
    "subCategory": "Wearables",
    "price": 49999,
    "originalPrice": 59999,
    "discountPercent": 17,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 219,
    "badge": "Bestseller",
    "description": "Grade 5 aerospace titanium bezel with sapphire crystal, ECG sensor, dual-frequency GNSS, and 14-day expedition battery reserve.",
    "stock": 18,
    "inStock": true,
    "weightKg": 0.065,
    "variants": [
      {
        "id": "v-titanium-grey",
        "name": "Raw Titanium",
        "colorHex": "#94a3b8",
        "inStock": true
      },
      {
        "id": "v-stealth-black",
        "name": "Stealth DLC Black",
        "colorHex": "#0f172a",
        "inStock": true
      }
    ],
    "images": {
      "high": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Display": "1.4\" Ultra-Bright AMOLED (2,000 nits)",
      "Water Resistance": "10 ATM (100 meters diving)",
      "Battery": "14 days smartwatch mode / 48 hrs GPS",
      "Sensors": "Optical HR, SpO2, ECG, Barometer, Altimeter"
    },
    "features": [
      "Dual-frequency L1 + L5 GPS precision track logging",
      "Offline topographical vector maps with turn-by-turn routing",
      "Continuous biometric monitoring with recovery advisor"
    ]
  },
  {
    "id": "lumina-vision-ar",
    "name": "Lumina Spatial AR Studio Glasses",
    "brand": "Lumina Labs",
    "tagline": "Next-Gen Micro-OLED Spatial Computing Eyewear",
    "category": "Tech",
    "subCategory": "Vision",
    "price": 64999,
    "originalPrice": 79999,
    "discountPercent": 19,
    "isPriceUpdated": true,
    "rating": 4.7,
    "reviewsCount": 144,
    "badge": "Innovation",
    "description": "Dual 4K micro-OLED optical waveguides delivering a virtual 200-inch cinema display at 120Hz with 6DoF spatial tracking.",
    "stock": 9,
    "inStock": true,
    "weightKg": 0.082,
    "images": {
      "high": "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Resolution": "Dual 4K Micro-OLED (3840x2160 per eye)",
      "Field of View": "52° cinematic FOV",
      "Refresh Rate": "120Hz native low-persistence",
      "Weight": "82g featherlight magnesium frame"
    },
    "features": [
      "Plug-and-play USB-C DisplayPort with Mac, PC, iPhone, and Android",
      "Directional acoustic sound drivers embedded in temple arms",
      "Electrochromic dimming lenses adjust instantly to ambient light"
    ]
  },
  {
    "id": "nexus-desk-hub",
    "name": "Nexus MagDock Studio Pro",
    "brand": "Nexus",
    "tagline": "14-in-1 Thunderbolt 4 Solid Aluminum Desktop Dock",
    "category": "Tech",
    "subCategory": "Workspace",
    "price": 18999,
    "originalPrice": 22999,
    "discountPercent": 17,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 295,
    "badge": "Pro Pick",
    "description": "CNC machined unibody dock with 40Gbps Thunderbolt 4, dual 6K display support, 100W Power Delivery, and integrated magnetic 15W Qi2 charging pad.",
    "stock": 31,
    "inStock": true,
    "weightKg": 0.62,
    "images": {
      "high": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Ports": "3x TB4, 4x USB-A 3.2, 2.5Gbps Ethernet, SD 4.0, Audio",
      "Power Delivery": "100W Host PD + 15W Qi2 wireless",
      "Chassis": "Milled 6000-series aerospace aluminum"
    },
    "features": [
      "Powers triple external monitors at 4K 144Hz or dual 6K 60Hz",
      "Built-in ultra-fast UHS-II SD card reader up to 312MB/s",
      "Internal thermal graphite cooling chamber with zero fan noise"
    ]
  },
  {
    "id": "stride-carbon-e-bike",
    "name": "Stride Carbon Monocoque E-Commuter",
    "brand": "Stride",
    "tagline": "Ultra-Light 12.8kg Carbon Fiber Smart E-Bike",
    "category": "Outdoor",
    "subCategory": "Mobility",
    "price": 169999,
    "originalPrice": 199999,
    "discountPercent": 15,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 88,
    "badge": "Limited",
    "description": "Toray T800 carbon fiber monocoque frame with integrated torque-sensor 250W hub motor, Gates Carbon belt drive, and 95km smart assist range.",
    "stock": 6,
    "inStock": true,
    "weightKg": 12.8,
    "images": {
      "high": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Frame": "Toray T800 Monocoque Carbon Fiber",
      "Motor": "250W Brushless motor with 45Nm dynamic torque sensor",
      "Range": "Up to 95 km assist per charge",
      "Drivetrain": "Gates Carbon CDX Belt Drive (greaseless, 30,000km lifespan)"
    },
    "features": [
      "Automatic electronic gear shifting based on rider cadence and incline",
      "Integrated GPS tracking, anti-theft motion alarm, and electronic locking",
      "Hydraulic disc brakes with built-in regenerative braking recharge"
    ]
  },
  {
    "id": "optix-cinema-lens",
    "name": "Optix Prime 50mm T1.5 Cinema Lens",
    "brand": "Optix",
    "tagline": "Cinematic Anamorphic Bokeh Full-Frame Cine Prime",
    "category": "Tech",
    "subCategory": "Photography",
    "price": 89999,
    "originalPrice": 104999,
    "discountPercent": 14,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 96,
    "badge": "Pro Glass",
    "description": "Zero breathing cinema prime lens with multi-coated ED fluorite elements, 16-blade circular aperture, and standard 0.8 MOD geared focus rings.",
    "stock": 14,
    "inStock": true,
    "weightKg": 0.95,
    "images": {
      "high": "https://images.unsplash.com/photo-1617043786394-f977fa12eddf?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1617043786394-f977fa12eddf?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1617043786394-f977fa12eddf?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1617043786394-f977fa12eddf?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Focal Length": "50mm Cinema Prime",
      "Aperture": "T1.5 to T22 (16-blade iris)",
      "Mount": "Interchangeable PL / Sony E / Canon RF"
    },
    "features": [
      "Exceptional optical sharpness edge-to-edge even wide open at T1.5",
      "Near-zero focus breathing during extreme rack focus pulls"
    ]
  },
  {
    "id": "aura-modular-backpack",
    "name": "Aura Stealth 28L Weatherproof Carry-On",
    "brand": "Aura",
    "tagline": "Ultra-Durable X-Pac VX21 Waterproof Daily Pack",
    "category": "Lifestyle",
    "subCategory": "Gear",
    "price": 14999,
    "originalPrice": 17999,
    "discountPercent": 17,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 420,
    "badge": "Popular",
    "description": "Constructed from laminated X-Pac waterproof sailcloth with Fidlock magnetic buckles, suspended 16\" laptop cradle, and clam-shell 180° opening.",
    "stock": 45,
    "inStock": true,
    "weightKg": 1.1,
    "images": {
      "high": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Capacity": "28 Liters (expandable to 32L)",
      "Fabric": "X-Pac VX21 Multi-layer Sailcloth laminate",
      "Hardware": "German Fidlock magnetic V-buckles & YKK AquaGuard zips"
    },
    "features": [
      "Self-standing reinforced bottom panel prevents tipping on floors",
      "Ergonomic dual-density EVA foam shoulder harness with load lifters"
    ]
  },
  {
    "id": "sonos-era-speaker",
    "name": "Sonos Era 300 Spatial Home Speaker",
    "brand": "Sonos",
    "tagline": "Dolby Atmos Spatial Audio Architectural Speaker",
    "category": "Home",
    "subCategory": "Audio",
    "price": 44999,
    "originalPrice": 52999,
    "discountPercent": 15,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 310,
    "badge": "Acoustic Pick",
    "description": "Six strategically positioned drivers disperse sound from wall to wall and floor to ceiling for a lifelike Dolby Atmos spatial soundstage.",
    "stock": 22,
    "inStock": true,
    "weightKg": 4.4,
    "images": {
      "high": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Drivers": "4 tweeters + 2 woofers powered by 6 Class-D digital amps",
      "Format Support": "Dolby Atmos Music, Apple Spatial Audio, 24-bit FLAC"
    },
    "features": [
      "Trueplay room tuning analyzes ambient architecture and calibrates EQ",
      "Capacitive touch volume slider with instant swipe response"
    ]
  },
  {
    "id": "leica-q3-camera",
    "name": "Leica Q3 60MP Full-Frame Street Camera",
    "brand": "Leica",
    "tagline": "Triple-Resolution BSI Sensor & Summilux 28mm f/1.7",
    "category": "Tech",
    "subCategory": "Photography",
    "price": 499990,
    "originalPrice": 549990,
    "discountPercent": 9,
    "isPriceUpdated": true,
    "rating": 5,
    "reviewsCount": 64,
    "badge": "Masterpiece",
    "description": "Full-frame 60MP BSI-CMOS sensor paired with legendary fixed Summilux 28mm f/1.7 ASPH prime lens and 8K video recording capabilities.",
    "stock": 4,
    "inStock": true,
    "weightKg": 0.74,
    "images": {
      "high": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Sensor": "60MP / 36MP / 18MP Triple-Resolution Full-Frame BSI",
      "Lens": "Leica Summilux 28mm f/1.7 ASPH with macro mode down to 17cm"
    },
    "features": [
      "Hybrid autofocus system combining Phase Detection with DFD Contrast AF",
      "Tilting 3-inch high-res touchscreen display"
    ]
  },
  {
    "id": "prism-monitor-studio",
    "name": "Prism View 32\" 6K Color-Accurate Display",
    "brand": "Prism",
    "tagline": "Mini-LED 6K 6016x3384 HDR1600 Reference Monitor",
    "category": "Tech",
    "subCategory": "Displays & Vision",
    "price": 189999,
    "originalPrice": 219999,
    "discountPercent": 14,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 128,
    "badge": "Pro Display",
    "description": "32-inch 6K IPS panel with 2,048 local dimming zones, 1600 nits peak brightness, 99% DCI-P3 gamut, and factory Delta-E < 1 calibration.",
    "stock": 12,
    "inStock": true,
    "weightKg": 7.8,
    "images": {
      "high": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Resolution": "6K 6016 × 3384 at 218 PPI",
      "Brightness": "1000 nits full-screen sustained / 1600 nits peak HDR"
    },
    "features": [
      "Built-in motorized colorimeter for automatic periodic recalibration",
      "Thunderbolt 4 daisy-chaining with 96W host laptop reverse charging"
    ]
  },
  {
    "id": "hyperion-mechanical-kb",
    "name": "Hyperion Hall-Effect Magnetic Keyboard",
    "brand": "Hyperion",
    "tagline": "Rapid-Trigger Analog Switches with 0.1mm Actuation",
    "category": "Gaming",
    "subCategory": "Workspace",
    "price": 16999,
    "originalPrice": 19999,
    "discountPercent": 15,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 512,
    "badge": "Esports Pick",
    "description": "Gasket-mounted CNC aluminum gaming keyboard with contactless magnetic Hall-effect switches, dynamic rapid trigger, and 8000Hz polling rate.",
    "stock": 38,
    "inStock": true,
    "weightKg": 1.45,
    "images": {
      "high": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Switches": "Gateron Magnetic Jade Hall Effect switches",
      "Polling Rate": "True 8,000Hz Ultra-Low Latency (0.125ms)",
      "Keycaps": "Double-shot PBT Cherry profile keycaps"
    },
    "features": [
      "Rapid Trigger resets actuation the instant you lift your finger",
      "Customizable per-key RGB backlighting and per-key actuation points from 0.1mm to 4.0mm"
    ]
  },
  {
    "id": "aero-light-mouse",
    "name": "AeroGlide Ultralight 49g Wireless Mouse",
    "brand": "AeroGlide",
    "tagline": "Magnesium Alloy Chassis with 4KHz Wireless Polling",
    "category": "Gaming",
    "subCategory": "Gaming & Esports",
    "price": 11999,
    "originalPrice": 14999,
    "discountPercent": 20,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 388,
    "badge": "Ultra Fast",
    "description": "Solid magnesium-alloy skeleton weighing only 49 grams, equipped with PixArt PAW3395 26,000 DPI sensor and optical microswitches rated for 100M clicks.",
    "stock": 28,
    "inStock": true,
    "weightKg": 0.049,
    "images": {
      "high": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Sensor": "PixArt PAW3395 (26,000 DPI, 650 IPS, 50G acceleration)",
      "Weight": "49 grams featherlight magnesium unibody",
      "Battery": "80 hours continuous gameplay at 1000Hz"
    },
    "features": [
      "True 4,000Hz wireless polling dongle included in box",
      "Zero-flex structural exoskeleton resists intense tournament gripping"
    ]
  },
  {
    "id": "zenith-drone-4k",
    "name": "Zenith Falcon 4K Cine Drone",
    "brand": "Zenith",
    "tagline": "Pocket 249g Foldable Drone with 4K HDR 60fps",
    "category": "Tech",
    "subCategory": "Photography",
    "price": 64999,
    "originalPrice": 74999,
    "discountPercent": 13,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 167,
    "badge": "Sub-249g",
    "description": "Ultra-compact sub-249g drone requiring no FAA registration. Features 1/1.3-inch CMOS sensor, 3-axis mechanical gimbal, and 38-minute flight battery.",
    "stock": 16,
    "inStock": true,
    "weightKg": 0.249,
    "images": {
      "high": "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Sensor": "1/1.3\" CMOS 48MP (Dual Native ISO f/1.7)",
      "Video": "4K HDR @ 60fps & True Vertical Shooting 4K",
      "Transmission": "12km FHD video transmission with anti-interference"
    },
    "features": [
      "True Vertical Shooting rotates camera 90° for instant native social media clips",
      "Level 5 wind resistance keeps hover locked stable in 38 km/h gusts"
    ]
  },
  {
    "id": "terra-camp-powerstation",
    "name": "TerraVolt 1200W LiFePO4 Power Station",
    "brand": "TerraVolt",
    "tagline": "1024Wh Portable Solar Generator with 3000+ Cycle Life",
    "category": "Outdoor",
    "subCategory": "Outdoor & Power",
    "price": 79999,
    "originalPrice": 94999,
    "discountPercent": 16,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 204,
    "badge": "Off-Grid",
    "description": "Rugged LiFePO4 battery pack with 1200W continuous pure sine wave AC output, 0-80% fast solar recharge in 60 minutes, and smart app telemetry.",
    "stock": 11,
    "inStock": true,
    "weightKg": 11.2,
    "images": {
      "high": "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Capacity": "1024Wh premium LiFePO4 chemistry (3500+ cycles to 80%)",
      "AC Output": "1200W Continuous Pure Sine Wave (2400W Surge X-Boost)",
      "Outputs": "4x AC Outlets, 2x USB-C 100W PD, 2x USB-A QC 3.0, 1x 12V Car Port"
    },
    "features": [
      "Ultra-fast AC wall charging hits 80% in just 50 minutes",
      "X-Stream MPPT solar input supports up to 500W solar arrays"
    ]
  },
  {
    "id": "apex-standing-desk",
    "name": "Apex Solid Walnut Dual-Motor Standing Desk",
    "brand": "Apex Design",
    "tagline": "Sustainably Harvested American Walnut with Memory Presets",
    "category": "Home",
    "subCategory": "Workspace",
    "price": 69999,
    "originalPrice": 84999,
    "discountPercent": 18,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 178,
    "badge": "Ergonomics",
    "description": "1.5-inch thick solid American walnut tabletop treated with organic matte hardwax-oil, paired with whisper-quiet dual electric motors supporting 140kg.",
    "stock": 8,
    "inStock": true,
    "weightKg": 42,
    "images": {
      "high": "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Dimensions": "160 cm (L) × 80 cm (W) × 3.8 cm (Thick)",
      "Height Range": "62 cm to 128 cm (continuous)",
      "Motor Type": "Dual synchronized German motors (<40 dB noise level)",
      "Load Capacity": "140 kg dynamic lift load"
    },
    "features": [
      "OLED digital controller with 4 tactile memory presets and sedentary reminder",
      "Integrated full-width steel cable management spine with power strip tray"
    ]
  },
  {
    "id": "solaris-polarized-shades",
    "name": "Solaris Carbon Ultra-Polarized Sunglasses",
    "brand": "Solaris",
    "tagline": "Hydrophobic Oleophobic Japanese Polarized Optics",
    "category": "Lifestyle",
    "subCategory": "Gear",
    "price": 11999,
    "originalPrice": 14999,
    "discountPercent": 20,
    "isPriceUpdated": true,
    "rating": 4.7,
    "reviewsCount": 260,
    "badge": "UV400",
    "description": "Milled carbon fiber frame with Japanese TAC polarized lenses, 100% UVA/UVB protection, and self-adjusting spring titanium hinges.",
    "stock": 35,
    "inStock": true,
    "weightKg": 0.022,
    "images": {
      "high": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Frame Material": "High-modulus carbon fiber composite (22g total)",
      "Lens Technology": "9-layer Japanese Triacetate Polarized with anti-scratch",
      "Protection": "100% UV400 Blocking (Cat. 3 Light Transmission)"
    },
    "features": [
      "Eliminates 99.9% of blinding road and water reflections with crystal clarity",
      "Hydrophobic and oleophobic coatings repel rainwater droplets and fingerprints"
    ]
  },
  {
    "id": "barista-touch-espresso",
    "name": "Barista Touch Espresso Machine",
    "brand": "Barista One",
    "tagline": "Dual Boiler PID Temperature Controlled Espresso Unit",
    "category": "Home",
    "subCategory": "Kitchen & Brew",
    "price": 89999,
    "originalPrice": 104999,
    "discountPercent": 14,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 231,
    "badge": "Artisan",
    "description": "Commercial 58mm portafilter with dual stainless steel boilers, digital PID temperature stability, rotary pump, and automated silky micro-foam steam wand.",
    "stock": 14,
    "inStock": true,
    "weightKg": 13.5,
    "images": {
      "high": "https://images.unsplash.com/photo-1589396575653-c09c794ff6a6?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1589396575653-c09c794ff6a6?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1589396575653-c09c794ff6a6?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1589396575653-c09c794ff6a6?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Boilers": "Dual independent stainless steel boilers (Brew + Steam)",
      "Portafilter": "58mm commercial stainless steel with double spout",
      "Pump": "Commercial rotary vane pump (9 bar consistent extraction)"
    },
    "features": [
      "Digital PID temperature control allows 0.5°C fine tuning for light roasts",
      "Simultaneous espresso shot pulling and milk steaming with zero delay"
    ]
  },
  {
    "id": "nordic-leather-boots",
    "name": "Nordic Explorer Horween Leather Boots",
    "brand": "Nordic Craft",
    "tagline": "Goodyear Welted Waterproof Chromexcel Leather Footwear",
    "category": "Lifestyle",
    "subCategory": "Gear",
    "price": 24999,
    "originalPrice": 29999,
    "discountPercent": 17,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 189,
    "badge": "Heritage",
    "description": "Handcrafted from full-grain Chicago Horween Chromexcel leather with 360° Goodyear welt construction, Vibram lug outsole, and cork bed midsoles.",
    "stock": 22,
    "inStock": true,
    "weightKg": 1.6,
    "images": {
      "high": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Leather": "Full-Grain Horween Chromexcel (Chicago, USA)",
      "Construction": "360° Goodyear Welt (fully recraftable)",
      "Outsole": "Vibram 430 Mini-Lug all-weather rubber sole"
    },
    "features": [
      "Naturally molds to your individual foot arch shape over time",
      "Gusseted tongue construction seals out trail gravel and rain"
    ]
  },
  {
    "id": "nebula-spatial-mic",
    "name": "Nebula Studio Spatial Microphone",
    "brand": "Nebula",
    "tagline": "Quad-Capsule 192kHz/24-Bit Broadcast Condenser",
    "category": "Tech",
    "subCategory": "Audio",
    "price": 19999,
    "originalPrice": 24999,
    "discountPercent": 20,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 312,
    "badge": "Broadcast",
    "description": "Four proprietary condenser capsules with switchable polar patterns, built-in DSP limiter, zero-latency headphone monitoring, and RGB gain meter.",
    "stock": 24,
    "inStock": true,
    "weightKg": 0.85,
    "images": {
      "high": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Sample Rate": "192 kHz / 24-bit studio resolution",
      "Capsules": "4 x 14mm custom-tuned electret condenser capsules",
      "Polar Patterns": "Cardioid, Omnidirectional, Bidirectional, Stereo"
    },
    "features": [
      "Hardware Analog Optical Limiter prevents distortion clipping during loud peaks",
      "Touch-sensitive instant mute button with illuminated LED ring indicator"
    ]
  },
  {
    "id": "lumenfold-eink-slate",
    "name": "LumenFold Color E-Ink Slate",
    "brand": "LumenFold",
    "tagline": "10.3\" Kaleido 3 Paper Display with Wacom EMR Stylus",
    "category": "Tech",
    "subCategory": "Vision",
    "price": 39999,
    "originalPrice": 46999,
    "discountPercent": 15,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 198,
    "badge": "Paper Like",
    "description": "Color digital paper tablet with 300 PPI black-and-white, 150 PPI color, 4,096 levels of pressure sensitivity, and glare-free sunlight reading.",
    "stock": 19,
    "inStock": true,
    "weightKg": 0.39,
    "images": {
      "high": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Display": "10.3-inch E Ink Kaleido 3 (4096 colors)",
      "Resolution": "300 PPI (Monochrome) / 150 PPI (Color)",
      "Stylus": "Wacom EMR battery-free pen with 4,096 pressure levels"
    },
    "features": [
      "Paper-like textured surface coating provides authentic tactile pen resistance",
      "Front light with adjustable warm/cold color temperature for night reading"
    ]
  },
  {
    "id": "aeroglide-ai-gimbal",
    "name": "AeroGlide 3-Axis AI Gimbal Stabilizer",
    "brand": "AeroGlide",
    "tagline": "Carbon Fiber 3-Axis Stabilizer with Deep Learning Subject Lock",
    "category": "Tech",
    "subCategory": "Photography",
    "price": 29999,
    "originalPrice": 35999,
    "discountPercent": 17,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 145,
    "badge": "AI Tracking",
    "description": "Motorized 3-axis gimbal featuring an independent optical AI vision module that locks onto human subjects, pets, and cars with zero app lag.",
    "stock": 15,
    "inStock": true,
    "weightKg": 0.89,
    "images": {
      "high": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Payload Capacity": "Up to 3.2 kg (supports full-frame mirrorless & lenses)",
      "Battery Life": "14 hours continuous stabilization with fast USB-C charge",
      "Chassis": "Toray carbon fiber arms with aerospace aluminum joints"
    },
    "features": [
      "Hardware AI tracker responds to gesture commands with no phone app pairing needed",
      "Instant vertical/horizontal quick-release mounting plate for fast format flips"
    ]
  },
  {
    "id": "cybershift-sim-wheel",
    "name": "CyberShift Direct-Drive 15Nm Sim Wheel",
    "brand": "CyberShift",
    "tagline": "15Nm Peak Torque Direct-Drive Magnesium Sim Racing Wheel Base",
    "category": "Gaming",
    "subCategory": "Gaming & Esports",
    "price": 84999,
    "originalPrice": 99999,
    "discountPercent": 15,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 112,
    "badge": "Esports Pro",
    "description": "Brushless direct-drive servo motor with 15Nm continuous peak torque, 22-bit optical encoder, zero cogging, and automotive-grade quick release.",
    "stock": 8,
    "inStock": true,
    "weightKg": 8.4,
    "images": {
      "high": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Peak Torque": "15 Nm realistic direct force feedback",
      "Encoder Resolution": "22-bit optical (4,194,304 pulses per revolution)",
      "Housing": "Aviation-grade CNC machined aluminum & carbon fiber"
    },
    "features": [
      "Zero-latency wireless steering wheel data & power induction transfer",
      "SimTelemetry real-time tire slip and curb rumble force feedback fidelity"
    ]
  },
  {
    "id": "quantum-planar-headset",
    "name": "Quantum Pro Planar Wireless Gaming Headset",
    "brand": "Quantum Acoustics",
    "tagline": "90mm Planar Magnetic Drivers with Hot-Swappable Dual Battery",
    "category": "Gaming",
    "subCategory": "Gaming & Esports",
    "price": 32999,
    "originalPrice": 38999,
    "discountPercent": 15,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 224,
    "badge": "Audiophile",
    "description": "Ultra-thin 90mm planar magnetic diaphragms producing studio-grade acoustic depth, 2.4GHz lossless wireless, and broadcast boom mic with AI noise reduction.",
    "stock": 17,
    "inStock": true,
    "weightKg": 0.39,
    "images": {
      "high": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Drivers": "90mm Audeze-grade Planar Magnetic transducers",
      "Wireless Protocol": "2.4GHz Ultra-Low Latency (<15ms) + Bluetooth 5.3 LE",
      "Battery System": "Dual hot-swappable 15-hour battery cells (30h total continuous)"
    },
    "features": [
      "Planar magnetic response reveals subtle footsteps and directional reloading cues",
      "Base station with OLED display and dual battery charging bay"
    ]
  },
  {
    "id": "titan-offroad-scooter",
    "name": "Titan X Dual-Motor Off-Road Scooter",
    "brand": "Titan Mobility",
    "tagline": "2400W Dual Motor Electric Scooter with 80km Range",
    "category": "Outdoor",
    "subCategory": "Mobility",
    "price": 139999,
    "originalPrice": 159999,
    "discountPercent": 13,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 94,
    "badge": "All Terrain",
    "description": "Dual 1200W brushless motors reaching 65 km/h, hydraulic disc brakes, full suspension, 11-inch tubeless pneumatic tires, and 80km range.",
    "stock": 7,
    "inStock": true,
    "weightKg": 34,
    "images": {
      "high": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Motors": "Dual 1200W Peak (2400W combined AWD torque)",
      "Battery": "60V 26Ah LG 21700 lithium pack (up to 80 km per charge)",
      "Suspension": "Front & rear adjustable hydraulic coil-over suspension"
    },
    "features": [
      "Tackles 40° mountain inclines effortlessly with dual-wheel traction",
      "Full motorcycle-grade lighting package with turn signals and under-deck LED ground effects"
    ]
  },
  {
    "id": "solarpod-lantern",
    "name": "SolarPod Modular Bio-Glow Lantern",
    "brand": "SolarPod",
    "tagline": "1200 Lumen Magnetic Lantern with Integrated Solar Lid",
    "category": "Outdoor",
    "subCategory": "Outdoor & Power",
    "price": 8999,
    "originalPrice": 10999,
    "discountPercent": 18,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 165,
    "badge": "Camp Ready",
    "description": "Weatherproof 1200-lumen magnetic camp lantern with solar charging lid, USB-C reverse power bank, and ambient flame warm-light simulation.",
    "stock": 40,
    "inStock": true,
    "weightKg": 0.52,
    "images": {
      "high": "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Brightness": "50 to 1,200 Lumens continuous stepless dimming",
      "Battery": "10,000mAh built-in power bank with 18W fast output",
      "Waterproofing": "IP67 submersible waterproof with buoyant floatation"
    },
    "features": [
      "Monocrystalline top lid recharges battery throughout daytime daylight",
      "Neodymium magnetic base sticks firmly to vehicle hoods, tents, and trailers"
    ]
  },
  {
    "id": "hydra-pure-flask",
    "name": "Hydra Pure UV-C Self-Cleaning Flask",
    "brand": "Hydra",
    "tagline": "Titanium Insulated Bottle with 280nm UV Purification",
    "category": "Outdoor",
    "subCategory": "Health & Recovery",
    "price": 7999,
    "originalPrice": 9499,
    "discountPercent": 16,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 388,
    "badge": "Pure Water",
    "description": "Aerospace Grade-1 Titanium double-wall vacuum flask with built-in 280nm UV-C LED sterilization cap that eliminates 99.99% of bacteria and viruses in 60s.",
    "stock": 28,
    "inStock": true,
    "weightKg": 0.28,
    "images": {
      "high": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Capacity": "750 mL (25 oz)",
      "Material": "Pure Grade-1 biocompatible titanium",
      "Thermal Rating": "Keeps drinks cold 24 hrs / hot 14 hrs"
    },
    "features": [
      "Automatic self-cleaning cycle activates every 2 hours to keep bottle odor-free",
      "Magnetic waterproof USB charging lid lasts 30 days per charge"
    ]
  },
  {
    "id": "zengravity-quilt",
    "name": "ZenGravity Temperature Weighted Quilt",
    "brand": "ZenGravity",
    "tagline": "100% Bamboo Viscose Micro-Glass Bead Weighted Blanket",
    "category": "Home",
    "subCategory": "Health & Recovery",
    "price": 12999,
    "originalPrice": 15999,
    "discountPercent": 19,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 420,
    "badge": "Deep Sleep",
    "description": "Breathable 400TC bamboo viscose blanket packed with hypo-allergenic nano-ceramic beads providing deep pressure touch stimulation for restorative sleep.",
    "stock": 20,
    "inStock": true,
    "weightKg": 9,
    "images": {
      "high": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Dimensions": "200 cm × 150 cm (Queen Size)",
      "Weight": "9.0 kg (optimally balanced for 65-90kg adults)",
      "Fabric": "100% Organic Bamboo Lyocell (Cooling & moisture wicking)"
    },
    "features": [
      "Even weight distribution pockets prevent beads from clumping in corners",
      "Thermoregulating weave prevents nighttime overheating"
    ]
  },
  {
    "id": "botanica-smart-garden",
    "name": "Botanica Smart Hydroponic Garden",
    "brand": "Botanica",
    "tagline": "24-Pod Vertical Indoor Growth Tower with Automated Nutrients",
    "category": "Home",
    "subCategory": "Smart Home",
    "price": 26999,
    "originalPrice": 32999,
    "discountPercent": 18,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 176,
    "badge": "Organic",
    "description": "Automated indoor hydroponic garden with full-spectrum horticultural LED grow lights, automatic pH & nutrient dosing, and companion smartphone harvest tracking.",
    "stock": 12,
    "inStock": true,
    "weightKg": 6.8,
    "images": {
      "high": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Plant Capacity": "24 individual plant seed pods",
      "Lighting": "72W Full-spectrum Samsung horticultural LEDs",
      "Water Tank": "8-Liter self-circulating reservoir with quiet pump"
    },
    "features": [
      "Grows herbs, greens, and cherry tomatoes 3x faster than traditional soil",
      "Water level sensor alerts you via push notification when refill is needed"
    ]
  },
  {
    "id": "kurogane-damascus-knife",
    "name": "Kurogane 67-Layer Damascus Santoku Knife",
    "brand": "Kurogane",
    "tagline": "VG-10 Japanese Super Steel with Hammered Tsuchime Cladding",
    "category": "Home",
    "subCategory": "Kitchen & Brew",
    "price": 14999,
    "originalPrice": 17999,
    "discountPercent": 17,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 310,
    "badge": "Master Craft",
    "description": "Hand-forged 7-inch Santoku knife featuring a VG-10 Japanese super-steel core clad in 66 layers of folded Damascus steel with an octagonal ebony wood handle.",
    "stock": 16,
    "inStock": true,
    "weightKg": 0.22,
    "images": {
      "high": "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Blade Steel": "VG-10 Super Steel core (61±1 HRC Rockwell Hardness)",
      "Edge Angle": "12°–15° razor edge per side (Honbazuke hand-sharpened)",
      "Handle": "Octagonal natural ebony wood with buffalo horn bolster"
    },
    "features": [
      "Hammered Tsuchime finish creates tiny air pockets preventing food sticking",
      "Exceptional edge retention requires minimal honing across months of slicing"
    ]
  },
  {
    "id": "nordic-deepsea-diver",
    "name": "Nordic DeepSea 300M Automatic Diver",
    "brand": "Nordic Horology",
    "tagline": "Grade 5 Titanium 300-Meter Diver with Swiss Caliber Movement",
    "category": "Lifestyle",
    "subCategory": "Wearables",
    "price": 74999,
    "originalPrice": 89999,
    "discountPercent": 17,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 154,
    "badge": "Swiss Made",
    "description": "Professional dive watch crafted from lightweight Grade 5 titanium, featuring a 120-click ceramic bezel, Swiss ETA automatic movement, and Super-LumiNova BGW9 dial.",
    "stock": 11,
    "inStock": true,
    "weightKg": 0.125,
    "images": {
      "high": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Movement": "Swiss Caliber ETA 2824-2 (28,800 vph / 4Hz, 38h reserve)",
      "Water Resistance": "30 ATM / 300 meters with helium escape valve",
      "Bezel": "120-click unidirectional scratchproof zirconia ceramic"
    },
    "features": [
      "Double-domed sapphire crystal with 5 layers of interior anti-reflective coating",
      "Helium escape valve engineered for saturation deep sea diving missions"
    ]
  },
  {
    "id": "razer-blade-16",
    "name": "Razer Blade 16 Dual-Mode Mini-LED Laptop",
    "brand": "Razer",
    "tagline": "World First Dual-Mode Mini-LED Display with RTX 4080",
    "category": "Gaming",
    "subCategory": "Gaming & Esports",
    "price": 279990,
    "originalPrice": 329990,
    "discountPercent": 15,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 160,
    "badge": "Dual Mode",
    "description": "CNC aluminum unibody gaming laptop with world-first dual-mode Mini-LED display: switch between UHD+ 120Hz for creator work and FHD+ 240Hz for esports.",
    "stock": 9,
    "inStock": true,
    "weightKg": 2.45,
    "images": {
      "high": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Display": "16\" Dual-Mode Mini-LED (4K 120Hz / FHD+ 240Hz)",
      "GPU": "NVIDIA GeForce RTX 4080 12GB GDDR6 (175W Max TGP)",
      "CPU": "Intel Core i9-14900HX 24-core"
    },
    "features": [
      "Patented vapor chamber cooling ensures thermal headroom in a 21mm thin chassis",
      "THX Spatial Audio quad speaker array with smart amplifiers"
    ]
  },
  {
    "id": "sony-wh1000xm5",
    "name": "Sony WH-1000XM5 Wireless Noise Cancelling",
    "brand": "Sony",
    "tagline": "Industry-Leading Dual Processor V1 & QN1 Noise Cancelling",
    "category": "Tech",
    "subCategory": "Audio",
    "price": 26990,
    "originalPrice": 34990,
    "discountPercent": 23,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 1240,
    "badge": "Bestseller",
    "description": "Industry-leading noise cancellation optimized automatically with 8 microphones, 30mm carbon fiber drivers, LDAC high-res wireless, and 30-hour battery life.",
    "stock": 45,
    "inStock": true,
    "weightKg": 0.25,
    "variants": [
      {
        "id": "v-black",
        "name": "Midnight Black",
        "colorHex": "#000000",
        "inStock": true
      },
      {
        "id": "v-silver",
        "name": "Platinum Silver",
        "colorHex": "#d1d5db",
        "inStock": true
      },
      {
        "id": "v-blue",
        "name": "Smoky Pink",
        "colorHex": "#f43f5e",
        "inStock": true
      }
    ],
    "images": {
      "high": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Noise Cancellation": "Auto NC Optimizer with Integrated Processor V1 + HD QN1",
      "Battery": "30 hours with ANC on (3-min charge gives 3 hours)",
      "Audio Codec": "LDAC, AAC, SBC, DSEE Extreme AI upscaling"
    },
    "features": [
      "Speak-to-Chat automatically pauses playback when you start speaking",
      "Multipoint connection pairs to laptop and smartphone simultaneously"
    ]
  },
  {
    "id": "gopro-hero12-black",
    "name": "GoPro HERO12 Black Creator Edition",
    "brand": "GoPro",
    "tagline": "5.3K60 Ultra HD Action Cam with HyperSmooth 6.0",
    "category": "Tech",
    "subCategory": "Photography",
    "price": 54990,
    "originalPrice": 62990,
    "discountPercent": 13,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 390,
    "badge": "Creator Bundle",
    "description": "Unbelievable image quality with 5.3K 60fps video, HDR video & photo, Emmy-winning HyperSmooth 6.0 stabilization with 360° Horizon Lock, and Volta battery grip.",
    "stock": 22,
    "inStock": true,
    "weightKg": 0.154,
    "images": {
      "high": "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Video Resolution": "5.3K @ 60fps / 4K @ 120fps / 2.7K @ 240fps 8x Slow-Mo",
      "Stabilization": "HyperSmooth 6.0 with 360° Horizon Lock",
      "Waterproof": "Submersible to 10m (33ft) without external housing"
    },
    "features": [
      "Bluetooth audio connectivity pairs with wireless earbuds for crisp vlogging commentary",
      "Creator Edition includes Volta battery grip, Media Mod, and Light Mod in package"
    ]
  },
  {
    "id": "keychron-q1-pro",
    "name": "Keychron Q1 Pro Wireless Custom Mechanical",
    "brand": "Keychron",
    "tagline": "Full CNC Aluminum QMK/VIA Wireless Custom Keyboard",
    "category": "Tech",
    "subCategory": "Workspace",
    "price": 18499,
    "originalPrice": 21999,
    "discountPercent": 16,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 410,
    "badge": "Custom Build",
    "description": "Premium full metal body 75% mechanical keyboard with hot-swappable Keychron K Pro switches, acoustic foam gaskets, programmable rotary knob, and Bluetooth 5.1.",
    "stock": 30,
    "inStock": true,
    "weightKg": 1.75,
    "images": {
      "high": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Body Material": "Full CNC machined 6063 aluminum",
      "Switches": "Hot-swappable Pre-Lubed Keychron K Pro Banana (Tactile)",
      "Connectivity": "Bluetooth 5.1 (3 devices) + Type-C wired (1000Hz polling)"
    },
    "features": [
      "Double-Gasket design significantly reduces acoustic metallic resonance",
      "Full QMK & VIA web configuration for remapping any key on Mac and Windows"
    ]
  },
  {
    "id": "logitech-mx-master-3s",
    "name": "Logitech MX Master 3S Performance Wireless",
    "brand": "Logitech",
    "tagline": "8K DPI Any-Surface Tracking & Quiet Click Ergonomics",
    "category": "Tech",
    "subCategory": "Workspace",
    "price": 9495,
    "originalPrice": 10995,
    "discountPercent": 14,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 1850,
    "badge": "Productivity",
    "description": "The ultimate productivity mouse. Features MagSpeed electromagnetic scrolling (1,000 lines/sec), 8K DPI track-on-glass sensor, 90% quieter clicks, and thumb wheel.",
    "stock": 50,
    "inStock": true,
    "weightKg": 0.141,
    "variants": [
      {
        "id": "v-graphite",
        "name": "Graphite Black",
        "colorHex": "#1f2937",
        "inStock": true
      },
      {
        "id": "v-pale-grey",
        "name": "Pale Grey",
        "colorHex": "#f3f4f6",
        "inStock": true
      }
    ],
    "images": {
      "high": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Sensor": "Darkfield high precision sensor (8,000 DPI adjustable in 50 DPI steps)",
      "Battery": "70 days on full charge (1 min charge provides 3 hours)",
      "Wheel": "MagSpeed Electromagnetic wheel with smart shift"
    },
    "features": [
      "Logitech Flow lets you seamlessly copy-paste text and files across 3 computers",
      "Ergonomic palm support relieves wrist tension over long work sessions"
    ]
  },
  {
    "id": "samsung-odyssey-oled-g9",
    "name": "Samsung Odyssey OLED G9 49\" Curved Monitor",
    "brand": "Samsung",
    "tagline": "49-inch Dual QHD 240Hz 0.03ms QD-OLED Curved Display",
    "category": "Gaming",
    "subCategory": "Displays & Vision",
    "price": 129999,
    "originalPrice": 159999,
    "discountPercent": 19,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 290,
    "badge": "Ultrawide",
    "description": "Massive 49\" 32:9 curved OLED display equivalent to two QHD monitors side by side. Features Neo Quantum Processor Pro, 240Hz refresh rate, 0.03ms response, and HDR True Black 400.",
    "stock": 10,
    "inStock": true,
    "weightKg": 12.9,
    "images": {
      "high": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Resolution": "Dual QHD (5120 × 1440) 32:9 Aspect Ratio",
      "Curve": "1800R immersive curvature",
      "Refresh & Response": "240Hz refresh rate & 0.03ms (GtG) response time"
    },
    "features": [
      "Smart Hub with Samsung Gaming Hub streams cloud games without a PC or console",
      "CoreSync rear RGB lighting matches game screen colors for room immersion"
    ]
  },
  {
    "id": "oura-ring-gen3-horizon",
    "name": "Oura Ring Gen 3 Horizon Titanium Smart Ring",
    "brand": "Oura",
    "tagline": "Discreet Sleep, Recovery & Heart Rate Titanium Ring",
    "category": "Lifestyle",
    "subCategory": "Wearables",
    "price": 34999,
    "originalPrice": 39999,
    "discountPercent": 13,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 650,
    "badge": "Health Icon",
    "description": "Lightweight, sleek titanium ring with research-grade biometric sensors. Tracks sleep stages, Daytime HR, SpO2, skin temperature trends, and daily Readiness Score.",
    "stock": 25,
    "inStock": true,
    "weightKg": 0.005,
    "variants": [
      {
        "id": "v-stealth",
        "name": "Stealth Matte Black",
        "colorHex": "#18181b",
        "inStock": true
      },
      {
        "id": "v-gold",
        "name": "18K Gold PVD",
        "colorHex": "#eab308",
        "inStock": true
      },
      {
        "id": "v-silver",
        "name": "High Polish Silver",
        "colorHex": "#e2e8f0",
        "inStock": true
      }
    ],
    "images": {
      "high": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Material": "Durable titanium with scratch-resistant PVD coating",
      "Waterproof": "Up to 100 meters (10 ATM)",
      "Battery Life": "Up to 7 days on single 30-minute wireless dock charge"
    },
    "features": [
      "Measures biometrics directly from pulse in finger arteries for 99.6% ECG accuracy",
      "Predicts illness onset up to 3 days early by monitoring temperature variance"
    ]
  },
  {
    "id": "theragun-pro-plus",
    "name": "Theragun PRO Plus Deep Tissue Percussive Massager",
    "brand": "Therabody",
    "tagline": "Multi-Therapy Percussive Massage with Infrared LED & Cold Therapy",
    "category": "Home",
    "subCategory": "Health & Recovery",
    "price": 49999,
    "originalPrice": 59999,
    "discountPercent": 17,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 380,
    "badge": "Recovery Pro",
    "description": "6-in-1 recovery device combining deep 16mm percussive massage, near-infrared LED light therapy, vibration therapy, thermal heat, and breathwork biometric guidance.",
    "stock": 14,
    "inStock": true,
    "weightKg": 1.4,
    "images": {
      "high": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Amplitude": "16mm depth percussive therapy reaching deep fascia",
      "Force": "Up to 60 lbs of stall force without bogging down",
      "Therapies": "Percussion, Infrared LED, Heat, Vibration, Breathwork, Cold (attachment)"
    },
    "features": [
      "Patented ergonomic triangle multi-grip handle allows treating hard-to-reach lower back",
      "LCD screen provides guided visual routines for muscle warmup, recovery, and sleep prep"
    ]
  },
  {
    "id": "fuji-x100vi",
    "name": "Fujifilm X100VI 40MP Digital Street Camera",
    "brand": "Fujifilm",
    "tagline": "40.2MP X-Trans CMOS 5 HR with 6.0 Stops In-Body Stabilization",
    "category": "Tech",
    "subCategory": "Photography",
    "price": 159999,
    "originalPrice": 179999,
    "discountPercent": 11,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 520,
    "badge": "Cult Classic",
    "description": "Iconic rangefinder design with 40.2MP sensor, Fujinon 23mm f/2 lens, 5-axis in-body image stabilization, hybrid optical/electronic viewfinder, and 20 Film Simulation modes.",
    "stock": 6,
    "inStock": true,
    "weightKg": 0.521,
    "variants": [
      {
        "id": "v-silver",
        "name": "Classic Silver",
        "colorHex": "#d1d5db",
        "inStock": true
      },
      {
        "id": "v-all-black",
        "name": "Stealth All Black",
        "colorHex": "#111827",
        "inStock": true
      }
    ],
    "images": {
      "high": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Sensor": "40.2MP X-Trans CMOS 5 HR with X-Processor 5",
      "Lens": "Fixed Fujinon 23mm f/2.0 II (35mm equivalent field of view)",
      "IBIS": "5-axis In-Body Image Stabilization up to 6.0 stops"
    },
    "features": [
      "Advanced Hybrid Viewfinder switches between 0.52x optical rangefinder and 3.69M-dot OLED",
      "Includes latest REALA ACE analog film simulation for warm portrait tones"
    ]
  },
  {
    "id": "nanoleaf-lines-rgb",
    "name": "Nanoleaf Lines 60° Modular Smart RGB Bar Kit",
    "brand": "Nanoleaf",
    "tagline": "Backlit Modular Smart LED Light Bars with Screen Mirror",
    "category": "Home",
    "subCategory": "Smart Home",
    "price": 16999,
    "originalPrice": 19999,
    "discountPercent": 15,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 310,
    "badge": "Smart Lighting",
    "description": "Modular backlit LED light bars that click together into custom geometric wall patterns. Features dynamic color animations, music visualizer, and screen mirroring sync.",
    "stock": 26,
    "inStock": true,
    "weightKg": 1.1,
    "images": {
      "high": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Color Temperature": "1200K–6500K tunable white + 16 Million RGB Colors",
      "Compatibility": "Apple HomeKit, Google Home, Alexa, Razer Chroma, Matter over Thread",
      "Pack Contents": "9 Light Lines + 9 Hexagon Mounting Connectors + Power Supply"
    },
    "features": [
      "Rhythm Music Visualizer pulses lighting animations to the beat of in-room audio",
      "Screen Mirror reflects desktop gaming and movie action onto your studio wall"
    ]
  },
  {
    "id": "sony-bravia-xr-65",
    "name": "Sony Bravia XR 65\" 4K QD-OLED Cinema TV",
    "brand": "Sony",
    "tagline": "Cognitive Processor XR & Acoustic Surface Audio+",
    "category": "Tech",
    "subCategory": "Displays & Vision",
    "price": 189990,
    "originalPrice": 249990,
    "discountPercent": 24,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 420,
    "badge": "Cinema King",
    "description": "Quantum Dot OLED panel delivering pure blacks, billion-color brightness, Google TV with Bravia Core cinema streaming, and dedicated PS5 auto HDR gaming optimization.",
    "stock": 15,
    "inStock": true,
    "weightKg": 24.2,
    "images": {
      "high": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Display Panel": "65-inch QD-OLED 4K (3840 × 2160) at 120Hz VRR",
      "Processor": "Cognitive Processor XR with AI Object Recognition",
      "Sound System": "60W Acoustic Surface Audio+ vibrating actuators"
    },
    "features": [
      "Acoustic Surface Audio vibrates the TV glass itself for pinpoint dialogue location",
      "XR Triluminos Max reproduces billions of saturated shades with zero color washing"
    ]
  },
  {
    "id": "dji-mavic-4-cine",
    "name": "DJI Mavic 4 Pro 8K Hasselblad Cinema Drone",
    "brand": "DJI",
    "tagline": "Triple Optical Camera System with Omnidirectional APAS 5.0",
    "category": "Tech",
    "subCategory": "Photography",
    "price": 164900,
    "originalPrice": 199990,
    "discountPercent": 18,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 184,
    "badge": "Pro Aerial",
    "description": "Flagship tri-camera drone with 4/3 CMOS Hasselblad main sensor, 70mm medium tele, and 166mm telephoto camera. Features 46-minute flight time and 20km O4 video transmission.",
    "stock": 10,
    "inStock": true,
    "weightKg": 0.958,
    "images": {
      "high": "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Main Sensor": "20MP 4/3 CMOS Hasselblad L2D-20c (f/2.8-f/11)",
      "Video Capability": "5.1K @ 50fps / 4K @ 120fps D-Log M & Apple ProRes",
      "Flight Duration": "46 minutes maximum hover and cruise"
    },
    "features": [
      "Triple focal lengths (24mm, 70mm, 166mm) provide unmatched cinematic framing",
      "DJI O4 transmission delivers 1080p 60fps live feed up to 20 km distance"
    ]
  },
  {
    "id": "asus-rog-strix-scar-18",
    "name": "ASUS ROG Strix SCAR 18 RTX 4090 Gaming Beast",
    "brand": "ASUS ROG",
    "tagline": "Intel i9-14900HX, RTX 4090 16GB & 2.5K Nebula HDR Mini-LED",
    "category": "Gaming",
    "subCategory": "Gaming & Esports",
    "price": 319990,
    "originalPrice": 379990,
    "discountPercent": 16,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 98,
    "badge": "Ultimate Power",
    "description": "The pinnacle of mobile PC gaming performance. Powered by Intel Core i9-14900HX 24-core processor, full 175W TGP NVIDIA GeForce RTX 4090, 64GB DDR5 RAM, and 18-inch 240Hz Nebula HDR display.",
    "stock": 7,
    "inStock": true,
    "weightKg": 3.1,
    "images": {
      "high": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Processor": "Intel Core i9-14900HX (24 Cores / 32 Threads, up to 5.8 GHz)",
      "Graphics": "NVIDIA GeForce RTX 4090 16GB GDDR6 (175W Max TGP with MUX)",
      "Memory & Storage": "64GB DDR5 5600MHz + 2TB PCIe 4.0 NVMe RAID 0 SSD"
    },
    "features": [
      "Conductonaut Extreme liquid metal compound on both CPU and GPU for ultra-low temps",
      "Per-key RGB mechanical keyboard with optical switches and Aura Sync"
    ]
  },
  {
    "id": "dyson-airwrap-styler",
    "name": "Dyson Airwrap Multi-Styler Complete Long",
    "brand": "Dyson",
    "tagline": "Coanda Airflow Styling without Extreme Heat Damage",
    "category": "Lifestyle",
    "subCategory": "Health & Recovery",
    "price": 49900,
    "originalPrice": 54900,
    "discountPercent": 9,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 512,
    "badge": "Luxury Care",
    "description": "Engineered for multiple hair types and lengths. Harnesses the aerodynamic Coanda effect to curl, shape, and hide flyaways using air instead of extreme heat.",
    "stock": 28,
    "inStock": true,
    "weightKg": 0.61,
    "variants": [
      {
        "id": "v-copper-nickel",
        "name": "Special Edition Strawberry Bronze & Blush Pink",
        "colorHex": "#e0a96d",
        "inStock": true
      },
      {
        "id": "v-prussian-blue",
        "name": "Prussian Blue & Rich Copper",
        "colorHex": "#1e3a8a",
        "inStock": true
      }
    ],
    "images": {
      "high": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Motor": "Dyson V9 digital motor (110,000 RPM, 3.2kPa air pressure)",
      "Heat Control": "Intelligent sensor measures airflow temperature 40x per second (<150°C)",
      "Attachments Included": "6 attachments (30mm/40mm long barrels, smoothing brushes, Coanda dryer)"
    },
    "features": [
      "Coanda smoothing dryer switches from drying to smoothing in a single twist",
      "Includes premium magnetic Prussian Blue presentation storage case"
    ]
  },
  {
    "id": "marshall-stanmore-iii",
    "name": "Marshall Stanmore III Iconic Home Bluetooth Speaker",
    "brand": "Marshall",
    "tagline": "Room-Filling Signature Vintage Rock Soundstage",
    "category": "Tech",
    "subCategory": "Audio",
    "price": 34999,
    "originalPrice": 39999,
    "discountPercent": 13,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 340,
    "badge": "Retro Classic",
    "description": "The heavyweight of home speakers. Stanmore III re-engineered with outward-angled tweeters and updated waveguides to deliver a soundstage so wide it fills any living room.",
    "stock": 20,
    "inStock": true,
    "weightKg": 4.25,
    "variants": [
      {
        "id": "v-vintage-black",
        "name": "Black & Brass",
        "colorHex": "#18181b",
        "inStock": true
      },
      {
        "id": "v-vintage-cream",
        "name": "Vintage Cream",
        "colorHex": "#fef3c7",
        "inStock": true
      },
      {
        "id": "v-vintage-brown",
        "name": "Tuscan Brown",
        "colorHex": "#78350f",
        "inStock": true
      }
    ],
    "images": {
      "high": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Amplifiers": "One 50W Class D for woofer + Two 15W Class D for tweeters (80W total)",
      "Frequency Range": "45–20,000 Hz",
      "Inputs": "Bluetooth 5.2, 3.5mm Aux, RCA stereo inputs"
    },
    "features": [
      "Dynamic Loudness adjusts tonal balance to keep music vibrant at every volume level",
      "Signature analog brass knobs for tactile Bass, Treble, and Volume tuning"
    ]
  },
  {
    "id": "apple-watch-ultra-2",
    "name": "Apple Watch Ultra 2 GPS + Cellular 49mm",
    "brand": "Apple",
    "tagline": "Titanium Case with S9 SiP & 3000 Nits Brightness",
    "category": "Lifestyle",
    "subCategory": "Wearables",
    "price": 89900,
    "originalPrice": 99900,
    "discountPercent": 10,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 620,
    "badge": "Adventure Standard",
    "description": "Rugged 49mm aerospace-grade titanium case, precision dual-frequency GPS, up to 72 hours in Low Power Mode, Double Tap gesture control, and 100m water resistance.",
    "stock": 19,
    "inStock": true,
    "weightKg": 0.061,
    "variants": [
      {
        "id": "v-trail-loop",
        "name": "Natural Titanium / Orange Ocean Band",
        "colorHex": "#ea580c",
        "inStock": true
      },
      {
        "id": "v-alpine-loop",
        "name": "Natural Titanium / Olive Alpine Loop",
        "colorHex": "#3f6212",
        "inStock": true
      },
      {
        "id": "v-black-trail",
        "name": "Black Titanium / Dark Trail Loop",
        "colorHex": "#18181b",
        "inStock": true
      }
    ],
    "images": {
      "high": "https://images.unsplash.com/photo-1510017803434-a899398421b3?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1510017803434-a899398421b3?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1510017803434-a899398421b3?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1510017803434-a899398421b3?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Case": "49mm aerospace-grade titanium with raised bezel guards",
      "Display": "Always-On Retina display up to 3,000 nits (1 nit night mode)",
      "Chip": "Apple S9 SiP with 4-core Neural Engine and on-device Siri"
    },
    "features": [
      "Customizable Action button initiates workouts, drops waypoints, or triggers 86dB siren",
      "Magic Double Tap gesture answers calls and scrolls widgets with one hand"
    ]
  },
  {
    "id": "bose-qc-ultra-earbuds",
    "name": "Bose QuietComfort Ultra Spatial Earbuds",
    "brand": "Bose",
    "tagline": "World-Class Noise Cancellation & Immersive Audio",
    "category": "Tech",
    "subCategory": "Audio",
    "price": 25900,
    "originalPrice": 29900,
    "discountPercent": 13,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 432,
    "badge": "ANC Master",
    "description": "Breakthrough spatial audio places what you hear right in front of you. CustomTune technology automatically shapes audio to your unique ear geometry with legendary Bose silence.",
    "stock": 35,
    "inStock": true,
    "weightKg": 0.058,
    "variants": [
      {
        "id": "v-black",
        "name": "Black",
        "colorHex": "#000000",
        "inStock": true
      },
      {
        "id": "v-white-smoke",
        "name": "White Smoke",
        "colorHex": "#e2e8f0",
        "inStock": true
      },
      {
        "id": "v-moonstone-blue",
        "name": "Moonstone Blue",
        "colorHex": "#64748b",
        "inStock": true
      }
    ],
    "images": {
      "high": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Audio Modes": "Quiet Mode, Aware Mode with ActiveSense, Immersion Mode",
      "Battery Life": "6 hours playback (24 hours total with charging case)",
      "Bluetooth": "Snapdragon Sound aptX Adaptive lossless & multi-point"
    },
    "features": [
      "CustomTune acoustic chime maps ear resonance to neutralize high-frequency noises",
      "Umbrella-shaped silicone tips and soft stability bands create an airtight seal"
    ]
  },
  {
    "id": "breville-barista-touch",
    "name": "Breville Barista Touch Impress Espresso Machine",
    "brand": "Breville",
    "tagline": "Automated Touchscreen Third-Wave Specialty Espresso",
    "category": "Home",
    "subCategory": "Kitchen & Brew",
    "price": 112000,
    "originalPrice": 135000,
    "discountPercent": 17,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 145,
    "badge": "Cafe Grade",
    "description": "Step-by-step barista guidance with automated assisted tamping, intelligent dosing, and Auto MilQ microfoam texturing with specific plant-milk settings.",
    "stock": 8,
    "inStock": true,
    "weightKg": 10.3,
    "images": {
      "high": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Heating System": "ThermoJet heating system reaches 93°C extraction in 3 seconds",
      "Burr Grinder": "Baratza European hardened steel precision conical burrs",
      "Tamping": "Impress Puck System with 10kg assisted tamping"
    },
    "features": [
      "Touchscreen displays swipe-and-select coffee menu (Flat White, Latte, Cappuccino)",
      "Auto MilQ calibrated for dairy, almond, oat, and soy milk texturing"
    ]
  },
  {
    "id": "unistellar-smart-telescope",
    "name": "Unistellar eVscope Smart Deep-Sky Digital Telescope",
    "brand": "Unistellar",
    "tagline": "Autonomous AI Star Finding & Enhanced Nebula Vision",
    "category": "Outdoor",
    "subCategory": "Vision",
    "price": 245000,
    "originalPrice": 289000,
    "discountPercent": 15,
    "isPriceUpdated": true,
    "rating": 4.9,
    "reviewsCount": 78,
    "badge": "Deep Sky",
    "description": "Autonomous computerized smart telescope. In seconds, points and locks onto galaxies, nebulae, and comets, stacking live photons on your smartphone screen in vivid color.",
    "stock": 5,
    "inStock": true,
    "weightKg": 9,
    "images": {
      "high": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Sensor": "Sony Exmor IMX347 ultra-low-light sensor with live stacking",
      "Optical Aperture": "114mm (4.5\") with 450mm focal length (f/4)",
      "Database": "5,000+ deep sky objects with autonomous sky recognition"
    },
    "features": [
      "Enhanced Vision technology reveals colorful spirals of galaxies invisible to optical glass",
      "Light Pollution Reduction algorithm enables deep-sky observing from cities"
    ]
  },
  {
    "id": "nordictrack-smart-treadmill",
    "name": "NordicTrack Commercial X32i Incline Smart Treadmill",
    "brand": "NordicTrack",
    "tagline": "32\" HD Rotating Touchscreen & 40% Incline Mountain Climb",
    "category": "Home",
    "subCategory": "Health & Recovery",
    "price": 285000,
    "originalPrice": 340000,
    "discountPercent": 16,
    "isPriceUpdated": true,
    "rating": 4.8,
    "reviewsCount": 110,
    "badge": "Pro Fitness",
    "description": "Commercial incline trainer with 32-inch immersive rotating smart touchscreen, auto-adjusting 40% incline to -6% decline, Reflex cushioning, and 4.25 CHP DurX motor.",
    "stock": 6,
    "inStock": true,
    "weightKg": 195,
    "images": {
      "high": "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1200&q=85",
      "medium": "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=600&q=70",
      "low": "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=300&q=50",
      "placeholder": "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=60&q=20"
    },
    "specs": {
      "Screen": "32-inch Full HD Smart Touchscreen with 360° swivel",
      "Incline/Decline": "-6% Decline to +40% Mountain Incline",
      "Motor": "4.25 CHP Commercial DurX Plus continuous duty motor"
    },
    "features": [
      "Interactive iFIT auto-adjusts incline and speed in real-time to match global trails",
      "Burn up to 5x more calories with steep 40% incline hill hikes compared to flat walking"
    ]
  }
];

// Enrich each product with true 4K (3840px UHD) image assets and 5G network compatibility indicators
export const PRODUCTS: Product[] = RAW_PRODUCTS.map((p) => {
  const is5GDevice =
    Boolean(p.category === 'Tech' || p.category === 'Gaming' || p.subCategory === 'Wearables' || p.subCategory === 'Vision' || p.subCategory === 'Photography' || p.badge === 'Flagship') ||
    Boolean(p.specs && Object.values(p.specs).some(s => s.toLowerCase().includes('5g') || s.toLowerCase().includes('wireless') || s.toLowerCase().includes('wi-fi') || s.toLowerCase().includes('bluetooth')));

  const ultra4kMain =
    p.images.ultra4k ||
    (p.images.high.includes('unsplash.com')
      ? p.images.high.replace(/w=\d+/, 'w=3840').replace(/q=\d+/, 'q=95')
      : p.images.high);

  const galleryEnriched = p.gallery?.map((g) => ({
    ...g,
    ultra4k: g.ultra4k || (g.high.includes('unsplash.com') ? g.high.replace(/w=\d+/, 'w=3840').replace(/q=\d+/, 'q=95') : g.high),
  }));

  return {
    ...p,
    is5G: is5GDevice,
    images: {
      ...p.images,
      ultra4k: ultra4kMain,
    },
    gallery: galleryEnriched,
  };
});

export const CATEGORIES = [
  "All",
  "Tech",
  "Gaming",
  "Outdoor",
  "Home",
  "Lifestyle",
] as const;

export const SUBCATEGORIES = [
  "All",
  "Audio",
  "Wearables",
  "Workspace",
  "Mobility",
  "Vision",
  "Photography",
  "Smart Home",
  "Gaming & Esports",
  "Displays & Vision",
  "Outdoor & Power",
  "Kitchen & Brew",
  "Health & Recovery",
  "Gear",
] as const;
