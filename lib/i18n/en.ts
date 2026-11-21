import type { TranslationDictionary } from './types';

export const enDictionary: TranslationDictionary = {
  meta: {
    brand: 'MessMate',
    tagline: 'Structured Digital Management for Modern Messes & Shared Apartments',
  },
  nav: {
    home: 'Home',
    features: 'Features',
    howItWorks: 'How It Works',
    roomRental: 'Room Rental',
    roomRentals: 'Room Rentals',
    pricing: 'Pricing',
    about: 'About',
    faq: 'FAQ',
    contact: 'Contact',
    login: 'Login',
    getStarted: 'Get Started',
    primaryCta: 'Start Free',
    menuOpen: 'Open navigation menu',
    menuClose: 'Close navigation menu',
  },
  hero: {
    kicker: '01 / Modern Shared Living Platform',
    headline: 'Better Living Starts with Better Management.',
    subheadline:
      'Manage your mess, members, meals, expenses and accommodation in one organized platform.',
    primaryCta: 'Start Your 7-Day Free Trial',
    secondaryCta: 'Explore MessMate',
    trustMessage: 'Designed for students, bachelors, hostels and shared living communities.',
    previewTitle: 'Lakeview Residence — Dhanmondi 27',
    previewMonth: 'November 2026 · Sample Preview',
    mealRateLabel: 'Meal Overview',
    totalBazarLabel: 'Monthly Expenses',
    totalMealsLabel: 'Meals Logged',
    collectedRentLabel: 'Room Availability',
    memberLedgerLabel: 'Member Activity',
    paidStatus: 'Settled',
    dueStatus: 'Due',
    refundableStatus: 'Refundable',
  },
  trust: {
    segmentsLabel: 'Engineered for four shared-living models',
    segments: ['Student Mess', 'Bachelor Mess', 'Job Holder Mess', 'Shared Apartments'],
    metrics: [
      {
        value: '0-Dispute',
        label: 'Monthly Closing',
        context: 'Every taka of bazar, deposit, and utility split stays auditable by all members.',
      },
      {
        value: '< 4 min',
        label: 'Daily Operations',
        context: 'Managers record daily meal counts and bazar receipts in minutes from any phone.',
      },
      {
        value: '100%',
        label: 'Real-Time Visibility',
        context: 'Members check their exact meal count, current meal rate, and rent status anytime.',
      },
      {
        value: 'EN + বাংলা',
        label: 'Native Bilingual UI',
        context: 'Switch effortlessly between English and Bangla across every screen and statement.',
      },
    ],
  },
  featuresOverview: {
    kicker: 'Core Capabilities',
    title: 'Everything Your Mess Needs',
    subtitle:
      'Manage everyday mess activities with simple, organized tools designed for shared living.',
    viewAllCta: 'Explore All Features',
  },
  howItWorks: {
    kicker: 'Simple Process',
    title: 'Get Your Mess Organized in 4 Simple Steps',
    subtitle:
      'Start managing your shared living experience with a simple and organized process.',
    cta: 'Start Managing Your Mess',
    steps: [
      {
        number: '01',
        title: 'Create Your Mess',
        description:
          'Register your mess and set up its basic information, address and preferences.',
      },
      {
        number: '02',
        title: 'Invite Your Members',
        description: 'Add members, assign roles and organize room information.',
      },
      {
        number: '03',
        title: 'Manage Daily Activities',
        description:
          'Track meals, bazar expenses, rent, bills and everyday activities.',
      },
      {
        number: '04',
        title: 'Stay Organized',
        description:
          'View monthly statements, track payments, receive notices and understand your mess finances.',
      },
    ],
  },
  rentalShowcase: {
    kicker: 'Room Rental Showcase',
    title: 'Find a Place That Feels Like Home',
    subtitle:
      'Discover available rooms and shared living spaces that match your needs.',
    browseAllCta: 'Explore All Rooms',
    viewDetails: 'View Details',
    perMonth: '/ month',
    seatsLeft: 'seats open',
    verifiedLabel: 'Verified Mess',
    categories: {
      all: 'All Residences',
      student: 'Student Mess',
      bachelor: 'Bachelor Mess',
      'job-holder': 'Job Holder',
      'shared-apartment': 'Shared Apartment',
    },
  },
  financial: {
    kicker: 'Financial Transparency',
    title: 'Clear meal-rate math every member can verify at a glance.',
    subtitle:
      'Eliminate end-of-month friction. Adjust the monthly bazar total below to preview how MessMate recalculates the live meal rate and each member’s net payable or refundable balance.',
    formulaTitle: 'Auditable Settlement Formula',
    formulaText: 'Meal Rate = Total Bazar ÷ Total Meals · Net Balance = Deposit − (Meal Cost + Rent + Utilities)',
    adjustBazarLabel: 'Simulate Monthly Bazar Total',
    points: [
      'Automatic per-meal cost calculation accurate to the paisa',
      'Separate tracking for fixed room rent, shared utilities, and variable meal deposits',
      'Carry-forward balance support so refunds roll cleanly into next month',
      'Exportable monthly summary ready for WhatsApp or print archiving',
    ],
    tableHeaders: {
      member: 'Member & Room',
      meals: 'Meals',
      mealCost: 'Meal Cost',
      rentUtilities: 'Rent + Utils',
      deposit: 'Deposited',
      balance: 'Net Balance',
    },
    refundable: 'Refundable',
    payable: 'Payable Due',
    settled: 'Settled',
  },
  safety: {
    kicker: 'Emergency & Safety',
    title: 'Safety Comes First. Always.',
    subtitle:
      'Important emergency contacts and safety information should always be easy to find when you need them.',
    cards: [
      {
        title: 'National Emergency Hotlines',
        description:
          'Quick access to verified Bangladesh national emergency numbers (999, 102, and 16263) with direct tap-to-call links.',
      },
      {
        title: 'Mess-Specific Contact Directory',
        description:
          'Structured directories for mess owner, manager, local doctor, nearby hospital, pharmacy, maintenance, security, and private family contacts.',
      },
      {
        title: 'Location-Specific Safety Guidance',
        description:
          'Dedicated workspace blocks for emergency exits, fire safety, first aid, assembly points, building rules, and pinned safety notices.',
      },
    ],
    directoryTitle: 'Bangladesh National Emergency Services',
    directorySubtitle: 'Verified against official Bangladesh government portals',
    contacts: [
      { role: 'National Emergency Service', name: 'Police · Fire · Ambulance', phone: '999', availability: '24/7 Toll-Free' },
      { role: 'Fire Service & Civil Defence', name: 'Fire & Rescue Hotline', phone: '102', availability: '24/7 Emergency' },
      { role: 'Health Batayon', name: 'DGHS Health Call Center', phone: '16263', availability: '24/7 Health Support' },
    ],
  },
  themeShowcase: {
    kicker: 'Website Customization Showcase',
    title: 'Give your mess a branded public website in one click.',
    subtitle:
      'Every mess on MessMate can publish a clean, customizable public page showcasing house rules, live notices, and open room rentals. Test the live appearance controls below.',
    controlsTitle: 'Customize Public Microsite',
    accentLabel: 'Brand Accent Theme',
    layoutLabel: 'Header Presentation',
    sectionsLabel: 'Visible Public Modules',
    layoutCompact: 'Compact Bar',
    layoutEditorial: 'Full Banner',
    toggleNotices: 'Public House Notices',
    toggleRentals: 'Open Seat Listings',
    previewMessName: 'Greenview Scholars Mess',
    previewDomain: 'greenview.messmate.app',
    previewHeadline: 'Quiet, structured student residence in Dhanmondi.',
    previewSub: '18-member academic mess with automated meal ledger, filtered water, fiber internet, and 24/7 security.',
    previewNoticeTitle: 'Latest Notice · December Meal Deposit',
    previewNoticeBody: 'Please submit December bazar deposits by the 3rd. Guest meal requests close daily at 9:30 AM.',
    previewVacancyTitle: '1 Sunny Single Seat Available — Room 4B',
    previewVacancyMeta: '৳5,200 / mo · Attached Balcony · Available Dec 1',
    previewApplyBtn: 'Request Visit',
  },
  pricing: {
    kicker: 'Simple Subscription Model',
    title: 'Clear pricing for one mess or a customized multi-property business.',
    subtitle:
      'Start with a 7-day free trial on the Starter Plan (৳99/month after trial with no automatic renewal), or request a Customized Business Plan tailored to your properties.',
    monthly: 'Monthly',
    yearly: 'Yearly',
    saveBadge: '7-Day Trial',
    perMonth: '/ month',
    billedYearly: 'after 7-day trial',
    freeForever: '7 Days Free Trial',
    popularLabel: 'Starter Plan',
    startStarter: 'Start 7-Day Free Trial',
    startPro: 'Request Custom Pricing',
    contactSales: 'Request Custom Pricing',
    viewFullPricing: 'Open Dedicated Pricing Page',
    tiers: {
      starter: {
        name: 'Starter',
        description: 'For small shared flats and starter bachelor messes getting off spreadsheets.',
        memberLimit: 'Up to 8 members',
        features: [
          'Member directory & room assignments',
          'Daily meal tracking & live meal rate',
          'Bazar expense log & monthly closing',
          'Rent & utility split calculator',
          'Digital notice board & emergency contacts',
          'English & Bangla interface',
        ],
      },
      pro: {
        name: 'Mess Pro',
        description: 'Complete operations, financial statements, and public room rental marketing.',
        memberLimit: 'Up to 35 members',
        features: [
          'Everything in Starter',
          'Co-manager & House Owner role access',
          'Automated payment ledger & due reminders',
          'Branded public mess website & custom theme',
          'Featured Room Rental portal listings',
          'Downloadable monthly financial statements',
        ],
      },
      enterprise: {
        name: 'Multi-Mess & Hostel',
        description: 'For residential building owners and operators running multiple messes or floors.',
        memberLimit: 'Unlimited members & branches',
        features: [
          'Everything in Mess Pro',
          'Multi-building & multi-floor management',
          'Custom domain support for public microsite',
          'Consolidated owner revenue & occupancy reports',
          'Priority onboarding & data migration support',
          'Dedicated Bangla & English support desk',
        ],
      },
    },
  },
  testimonials: {
    kicker: 'Real Operational Outcomes',
    title: 'Trusted by mess managers, flatmates, and residence owners.',
    subtitle:
      'Hear how shared-living teams replaced end-of-month disputes with verifiable clarity.',
  },
  faq: {
    kicker: 'FAQ',
    title: 'Frequently Asked Questions',
    subtitle:
      'Find answers to common questions about MessMate and how it works.',
    viewAllCta: 'View Full FAQ Page',
    supportPrompt: 'Have another question about your mess or properties?',
    supportLink: 'Go to Contact section',
  },
  finalCta: {
    title: 'Ready to Make Mess Management Easier?',
    subtitle:
      'Bring your members, meals, expenses and everyday mess activities together in one organized platform.',
    primaryCta: 'Start Your 7-Day Free Trial',
    secondaryCta: 'Explore Custom Solutions',
  },
  footer: {
    description:
      'Modern digital management software for student messes, bachelor messes, job-holder residences, and shared apartments.',
    colProduct: 'Platform',
    colCompany: 'Company',
    colSegments: 'Built For',
    colLegal: 'Legal & Language',
    privacy: 'Privacy Policy',
    terms: 'Terms & Conditions',
    copyright: '© 2026 MessMate Technologies. All rights reserved.',
  },
  pages: {
    features: {
      title: 'Purpose-built modules for every shared residence workflow.',
      subtitle:
        'Filter by operational area to inspect how MessMate structures members, meals, bazar accounting, room rentals, and resident safety.',
      tabs: {
        all: 'All Modules',
        operations: 'Members & Rooms',
        finance: 'Meals & Finance',
        rentals: 'Rentals & Website',
        safety: 'Notices & Safety',
      },
    },
    howItWorks: {
      title: 'Designed around how real messes run from Day 1 to Day 30.',
      subtitle:
        'Explore step-by-step workflows tailored for Mess Managers, Resident Members, and House Owners.',
      roleTabs: {
        manager: 'For Mess Managers',
        member: 'For Members',
        owner: 'For House Owners',
      },
      cycleTitle: 'The Automated Monthly Closing Cycle',
      cycleSubtitle: 'No late-night calculator marathons at the end of the month.',
    },
    roomRental: {
      title: 'Find verified mess rooms, shared seats, and bachelor apartments.',
      subtitle:
        'Browse transparent listings published directly by MessMate-managed residences with clear monthly rent, utility charges, and house rules.',
      searchPlaceholder: 'Search by area (e.g. Dhanmondi, Uttara, Mirpur) or residence...',
      roomTypeAll: 'All Room Types',
      roomTypeSingle: 'Single Room',
      roomTypeShared: 'Shared Room',
      roomTypeSeat: 'Single Seat',
      genderAll: 'Any Policy',
      genderMale: 'Male Residence',
      genderFemale: 'Female Residence',
      genderAny: 'Co-ed / Mixed Flat',
      maxRentAny: 'Any Monthly Rent',
      sortFeatured: 'Featured First',
      sortLowHigh: 'Rent: Low to High',
      sortHighLow: 'Rent: High to Low',
      sortSeats: 'Most Seats Open',
      resetFilters: 'Reset Filters',
      showingCount: 'residences available',
      emptyTitle: 'No matching rooms found',
      emptyBody: 'Try widening your rent cap or clearing one of the active filters.',
      listBannerTitle: 'Have a vacant seat or room in your mess?',
      listBannerBody:
        'Publish your vacancy directly from your MessMate public website so qualified students and professionals can contact your manager directly.',
      listBannerCta: 'List Your Mess Free',
      modal: {
        monthlyRent: 'Base Monthly Rent',
        serviceCharge: 'Utilities & Service',
        mealDeposit: 'Est. Meal Deposit',
        availableFrom: 'Available From',
        amenities: 'Included Facilities',
        houseRules: 'House Guidelines',
        contactManager: 'Manager Contact',
        inquireNow: 'Request Room Visit',
        close: 'Close details',
      },
    },
    pricing: {
      title: 'Two clear subscription options designed for single messes and growing accommodation businesses.',
      subtitle:
        'Try the Starter Plan free for 7 days (৳99/month afterward with your consent) or configure a Customized Business Plan for hostels, multiple messes, and shared properties.',
      estimatorTitle: 'Starter Plan',
      estimatorSubtitle:
        'Everything needed to manage one mess cleanly at ৳99 per month after a 7-day free trial.',
      membersLabel: 'Properties',
      recommendedPlan: 'Selected Option',
      costPerMember: 'Monthly Plan',
      comparisonTitle: 'Customized Business Plan',
      comparisonSubtitle: 'Tailored around your property structure and operational workflows.',
      featureCol: 'Platform Capability',
    },
    about: {
      title: 'Modern digital infrastructure for shared living across South Asia and beyond.',
      subtitle:
        'We started MessMate after experiencing firsthand how manual notebooks, unclear bazar bills, and disorganized WhatsApp groups turn great flatmates into stressed bookkeepers.',
      storyKicker: 'Why MessMate Exists',
      storyTitle: 'Shared living works best when financial trust is effortless.',
      storyP1:
        'Millions of university students, early-career professionals, and urban bachelors rely on messes and shared apartments to live affordably near campuses and workplaces. Yet the operational backbone of these homes is still stuck in fragile paper ledgers and ad-hoc spreadsheets.',
      storyP2:
        'MessMate brings international SaaS craft to everyday shared housing—combining accurate meal-rate accounting, clean room-rent ledgers, verified room rental discovery, and emergency safety directories in both English and Bangla.',
      valuesTitle: 'Four Principles Behind Every Screen',
      values: [
        {
          title: 'Radical Financial Clarity',
          description:
            'Every bazar receipt, deposit, and meal count is transparent to members so trust never depends on manual double-checking.',
        },
        {
          title: 'Respect for Manager Time',
          description:
            'Most mess managers are full-time students or working professionals. Daily workflows take minutes, not hours.',
        },
        {
          title: 'Safety & Accountability',
          description:
            'Verified emergency directories and house notices protect residents when urgent situations occur.',
        },
        {
          title: 'Truly Bilingual Design',
          description:
            'English and Bangla are treated as first-class citizens—both in typography and natural everyday terminology.',
        },
      ],
      builtForTitle: 'Four Shared-Living Communities We Serve',
    },
    contact: {
      title: 'Talk to the MessMate onboarding and support team.',
      subtitle:
        'Whether you are setting up a 6-member student flat or migrating a 120-bed residence, send us a note and we will respond within one business day.',
      formTitle: 'Send Us an Inquiry',
      formSubtitle: 'All fields are validated so our team can prepare the right walkthrough for you.',
      fullName: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      messType: 'Residence Type',
      memberCount: 'Approximate Members',
      subject: 'Subject',
      message: 'How can we help?',
      submitBtn: 'Send Inquiry',
      submittingBtn: 'Submitting...',
      successTitle: 'Inquiry Received',
      successBody:
        'Thank you for reaching out to MessMate. Our onboarding team has logged your request and will contact you shortly via email or phone.',
      sendAnother: 'Send Another Inquiry',
      channelsTitle: 'Direct Contact Channels',
      supportHoursLabel: 'Support Hours',
      supportHoursValue: 'Saturday – Thursday · 9:00 AM – 8:00 PM (BST)',
      officeLabel: 'Headquarters',
      officeValue: 'House 24, Road 9/A, Dhanmondi, Dhaka 1209, Bangladesh',
      responseLabel: 'Average Response Time',
      responseValue: 'Under 4 business hours for onboarding requests',
      messTypes: {
        student: 'Student Mess',
        bachelor: 'Bachelor Mess',
        'job-holder': 'Job Holder Mess',
        'shared-apartment': 'Shared Apartment',
        'multi-mess': 'Multi-Mess / Hostel Operator',
      },
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle:
        'Search across setup, meal-rate formulas, rent billing, room rentals, data security, and bilingual support.',
      searchPlaceholder: 'Search questions (e.g. meal rate, Bangla, free plan, privacy)...',
      noResults: 'No questions matched your search query.',
      clearSearch: 'Clear Search',
    },
    privacy: {
      title: 'Privacy Policy',
      subtitle:
        'How MessMate collects, safeguards, and limits access to member profiles, financial ledgers, and emergency contact information.',
      lastUpdated: 'Last updated: November 2026',
    },
    terms: {
      title: 'Terms & Conditions',
      subtitle:
        'Clear terms governing the use of the MessMate SaaS platform, public room rental listings, and subscription billing.',
      lastUpdated: 'Last updated: November 2026',
    },
  },
};
