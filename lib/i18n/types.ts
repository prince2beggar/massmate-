export type Locale = 'en' | 'bn';

export interface TranslationDictionary {
  meta: {
    brand: string;
    tagline: string;
  };
  nav: {
    home: string;
    features: string;
    howItWorks: string;
    roomRental: string;
    roomRentals: string;
    pricing: string;
    about: string;
    faq: string;
    contact: string;
    login: string;
    getStarted: string;
    primaryCta: string;
    menuOpen: string;
    menuClose: string;
  };
  hero: {
    kicker: string;
    headline: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta: string;
    trustMessage: string;
    previewTitle: string;
    previewMonth: string;
    mealRateLabel: string;
    totalBazarLabel: string;
    totalMealsLabel: string;
    collectedRentLabel: string;
    memberLedgerLabel: string;
    paidStatus: string;
    dueStatus: string;
    refundableStatus: string;
  };
  trust: {
    segmentsLabel: string;
    segments: [string, string, string, string];
    metrics: Array<{ value: string; label: string; context: string }>;
  };
  featuresOverview: {
    kicker: string;
    title: string;
    subtitle: string;
    viewAllCta: string;
  };
  howItWorks: {
    kicker: string;
    title: string;
    subtitle: string;
    cta: string;
    steps: Array<{ number: string; title: string; description: string }>;
  };
  rentalShowcase: {
    kicker: string;
    title: string;
    subtitle: string;
    browseAllCta: string;
    viewDetails: string;
    perMonth: string;
    seatsLeft: string;
    verifiedLabel: string;
    categories: {
      all: string;
      student: string;
      bachelor: string;
      'job-holder': string;
      'shared-apartment': string;
    };
  };
  financial: {
    kicker: string;
    title: string;
    subtitle: string;
    formulaTitle: string;
    formulaText: string;
    adjustBazarLabel: string;
    points: string[];
    tableHeaders: {
      member: string;
      meals: string;
      mealCost: string;
      rentUtilities: string;
      deposit: string;
      balance: string;
    };
    refundable: string;
    payable: string;
    settled: string;
  };
  safety: {
    kicker: string;
    title: string;
    subtitle: string;
    cards: Array<{ title: string; description: string }>;
    directoryTitle: string;
    directorySubtitle: string;
    contacts: Array<{ role: string; name: string; phone: string; availability: string }>;
  };
  themeShowcase: {
    kicker: string;
    title: string;
    subtitle: string;
    controlsTitle: string;
    accentLabel: string;
    layoutLabel: string;
    sectionsLabel: string;
    layoutCompact: string;
    layoutEditorial: string;
    toggleNotices: string;
    toggleRentals: string;
    previewMessName: string;
    previewDomain: string;
    previewHeadline: string;
    previewSub: string;
    previewNoticeTitle: string;
    previewNoticeBody: string;
    previewVacancyTitle: string;
    previewVacancyMeta: string;
    previewApplyBtn: string;
  };
  pricing: {
    kicker: string;
    title: string;
    subtitle: string;
    monthly: string;
    yearly: string;
    saveBadge: string;
    perMonth: string;
    billedYearly: string;
    freeForever: string;
    popularLabel: string;
    startStarter: string;
    startPro: string;
    contactSales: string;
    viewFullPricing: string;
    tiers: Record<
      'starter' | 'pro' | 'enterprise',
      {
        name: string;
        description: string;
        memberLimit: string;
        features: string[];
      }
    >;
  };
  testimonials: {
    kicker: string;
    title: string;
    subtitle: string;
  };
  faq: {
    kicker: string;
    title: string;
    subtitle: string;
    viewAllCta: string;
    supportPrompt: string;
    supportLink: string;
  };
  finalCta: {
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
  };
  footer: {
    description: string;
    colProduct: string;
    colCompany: string;
    colSegments: string;
    colLegal: string;
    privacy: string;
    terms: string;
    copyright: string;
  };
  pages: {
    features: {
      title: string;
      subtitle: string;
      tabs: {
        all: string;
        operations: string;
        finance: string;
        rentals: string;
        safety: string;
      };
    };
    howItWorks: {
      title: string;
      subtitle: string;
      roleTabs: {
        manager: string;
        member: string;
        owner: string;
      };
      cycleTitle: string;
      cycleSubtitle: string;
    };
    roomRental: {
      title: string;
      subtitle: string;
      searchPlaceholder: string;
      roomTypeAll: string;
      roomTypeSingle: string;
      roomTypeShared: string;
      roomTypeSeat: string;
      genderAll: string;
      genderMale: string;
      genderFemale: string;
      genderAny: string;
      maxRentAny: string;
      sortFeatured: string;
      sortLowHigh: string;
      sortHighLow: string;
      sortSeats: string;
      resetFilters: string;
      showingCount: string;
      emptyTitle: string;
      emptyBody: string;
      listBannerTitle: string;
      listBannerBody: string;
      listBannerCta: string;
      modal: {
        monthlyRent: string;
        serviceCharge: string;
        mealDeposit: string;
        availableFrom: string;
        amenities: string;
        houseRules: string;
        contactManager: string;
        inquireNow: string;
        close: string;
      };
    };
    pricing: {
      title: string;
      subtitle: string;
      estimatorTitle: string;
      estimatorSubtitle: string;
      membersLabel: string;
      recommendedPlan: string;
      costPerMember: string;
      comparisonTitle: string;
      comparisonSubtitle: string;
      featureCol: string;
    };
    about: {
      title: string;
      subtitle: string;
      storyKicker: string;
      storyTitle: string;
      storyP1: string;
      storyP2: string;
      valuesTitle: string;
      values: Array<{ title: string; description: string }>;
      builtForTitle: string;
    };
    contact: {
      title: string;
      subtitle: string;
      formTitle: string;
      formSubtitle: string;
      fullName: string;
      email: string;
      phone: string;
      messType: string;
      memberCount: string;
      subject: string;
      message: string;
      submitBtn: string;
      submittingBtn: string;
      successTitle: string;
      successBody: string;
      sendAnother: string;
      channelsTitle: string;
      supportHoursLabel: string;
      supportHoursValue: string;
      officeLabel: string;
      officeValue: string;
      responseLabel: string;
      responseValue: string;
      messTypes: {
        student: string;
        bachelor: string;
        'job-holder': string;
        'shared-apartment': string;
        'multi-mess': string;
      };
    };
    faq: {
      title: string;
      subtitle: string;
      searchPlaceholder: string;
      noResults: string;
      clearSearch: string;
    };
    privacy: {
      title: string;
      subtitle: string;
      lastUpdated: string;
    };
    terms: {
      title: string;
      subtitle: string;
      lastUpdated: string;
    };
  };
}
