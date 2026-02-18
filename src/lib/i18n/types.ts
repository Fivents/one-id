export type Locale = "pt" | "en" | "fr" | "es" | "zh";

export type TranslationSchema = {
  common: {
    actions: {
      save: string;
      cancel: string;
      delete: string;
      edit: string;
      create: string;
      confirm: string;
      close: string;
      back: string;
      next: string;
      search: string;
      filter: string;
      export: string;
      import: string;
      loading: string;
      yes: string;
      no: string;
      or: string;
      logout: string;
      clear: string;
      viewDetails: string;
    };
    status: {
      active: string;
      inactive: string;
      pending: string;
      approved: string;
      rejected: string;
    };
    labels: {
      name: string;
      email: string;
      password: string;
      phone: string;
      document: string;
      date: string;
      status: string;
      role: string;
      organization: string;
      actions: string;
      total: string;
      showing: string;
      of: string;
      noResults: string;
      all: string;
      company: string;
      jobTitle: string;
      createdAt: string;
    };
  };
  auth: {
    login: {
      title: string;
      description: string;
      googleButton: string;
      googleOnly: string;
      emailLabel: string;
      passwordLabel: string;
      loginButton: string;
      loggingIn: string;
      connectionError: string;
      invalidCredentials: string;
    };
    setPassword: {
      title: string;
      description: string;
      newPassword: string;
      confirmPassword: string;
      saving: string;
      success: string;
      redirecting: string;
      invalidToken: string;
      passwordMismatch: string;
      minLength: string;
    };
    errors: {
      google_domain_invalid: string;
      google_failed: string;
      google_token_failed: string;
      google_auth_failed: string;
    };
  };
  nav: {
    sidebar: {
      dashboard: string;
      events: string;
      organizations: string;
      billing: string;
      users: string;
      settings: string;
      totems: string;
    };
    roleLabels: {
      SUPER_ADMIN: string;
      ORG_OWNER: string;
      ORG_ADMIN: string;
      EVENT_MANAGER: string;
      STAFF: string;
    };
    footer: string;
  };
  dashboard: {
    title: string;
    description: string;
    superAdmin: {
      organizations: string;
      users: string;
      events: string;
      participants: string;
      checkIns: string;
      platformOverview: string;
    };
    orgAdmin: {
      yourEvents: string;
      yourParticipants: string;
      yourCheckIns: string;
      yourTotems: string;
      orgOverview: string;
    };
    charts: {
      checkInsLast7Days: string;
      checkInsLast7DaysDescription: string;
      noCheckInsLast7Days: string;
      eventDistribution: string;
      eventDistributionDescription: string;
      noEventsRegistered: string;
    };
    recentEvents: string;
    recentEventsDescription: string;
    noEvents: string;
    recentCheckIns: string;
    recentCheckInsPlatform: string;
    recentCheckInsOrg: string;
    noCheckIns: string;
    auditLog: {
      title: string;
      description: string;
      selectOrganization: string;
      allEvents: string;
      loading: string;
      refresh: string;
      logCount: string;
      selectOrgPrompt: string;
      loadingLogs: string;
      noLogs: string;
    };
  };
  events: {
    new: {
      title: string;
      description: string;
      orgNotFound: string;
      createError: string;
      connectionError: string;
      creating: string;
    };
    list: {
      title: string;
      description: string;
      newEvent: string;
      noEvents: string;
      searchPlaceholder: string;
      allStatuses: string;
      allOrganizations: string;
      eventCount: string;
      filteredOf: string;
    };
    form: {
      createTitle: string;
      editTitle: string;
      name: string;
      location: string;
      startDate: string;
      endDate: string;
      maxParticipants: string;
      description: string;
      status: string;
      eventInfo: string;
      eventInfoDescription: string;
      namePlaceholder: string;
      descriptionPlaceholder: string;
      locationPlaceholder: string;
      address: string;
      addressPlaceholder: string;
      noLimit: string;
      organization: string;
      selectOrganization: string;
      checkInMethods: string;
      facial: string;
      manual: string;
      saving: string;
      saveChanges: string;
    };
    statuses: {
      DRAFT: string;
      PUBLISHED: string;
      ONGOING: string;
      FINISHED: string;
      CANCELLED: string;
      ACTIVE: string;
      COMPLETED: string;
    };
    actions: {
      publish: string;
      start: string;
      finish: string;
      deleteConfirmTitle: string;
      deleteConfirmDescription: string;
    };
    detail: {
      participants: string;
      checkIns: string;
      checkInPoints: string;
      addParticipant: string;
      exportParticipants: string;
      exportCheckIns: string;
      noParticipants: string;
      noCheckIns: string;
      noCheckInPoints: string;
      totems: string;
      labels: string;
      date: string;
      ofMax: string;
      ofParticipants: string;
      eventParticipants: string;
      face: string;
      faceRegistered: string;
      waiting: string;
      add: string;
      planLimit: string;
      newTotem: string;
      newPoint: string;
      noTotems: string;
      createPointsFirst: string;
      planLimitReached: string;
      planLimitUpgrade: string;
      editPoint: string;
      pointDescription: string;
      apiKeyTitle: string;
      apiKeyDescription: string;
      apiKeyWarning: string;
      copied: string;
      understood: string;
      point: string;
      noTotemLinked: string;
      totemLinked: string;
      importResults: string;
      importTotalRows: string;
      importCreated: string;
      importSkipped: string;
      noValidRows: string;
      fileError: string;
      dialogAddParticipant: string;
      dialogEditParticipant: string;
      dialogParticipantDescription: string;
    };
  };
  organizations: {
    list: {
      title: string;
      description: string;
      newOrg: string;
      noOrgs: string;
    };
    detail: {
      members: string;
      plan: string;
      events: string;
      info: string;
    };
    form: {
      createTitle: string;
      name: string;
      email: string;
      document: string;
      phone: string;
      orgInfo: string;
      orgInfoDescription: string;
      namePlaceholder: string;
      emailPlaceholder: string;
      documentPlaceholder: string;
      phonePlaceholder: string;
      creating: string;
      createError: string;
      connectionError: string;
      selectPlan: string;
      editDescription: string;
      createDescription: string;
      planRequired: string;
    };
  };
  users: {
    list: {
      title: string;
      description: string;
      newUser: string;
      noUsers: string;
    };
    form: {
      createTitle: string;
      editTitle: string;
      createDescription: string;
      editDescription: string;
      name: string;
      email: string;
      role: string;
      organization: string;
    };
    labels: {
      resetPassword: string;
      toggleActive: string;
      activate: string;
      deactivate: string;
      setupPending: string;
    };
  };
  billing: {
    title: string;
    superAdmin: {
      plans: string;
      planRequests: string;
      noPlanRequests: string;
      tier: string;
      price: string;
      maxEvents: string;
      maxParticipants: string;
      maxTotems: string;
      free: string;
      description: string;
      newPlan: string;
      customizable: string;
      perMonth: string;
      participantsPerEvent: string;
      members: string;
      pointsPerEvent: string;
      facialRecognition: string;
      qrCode: string;
      subscriberCount: string;
      pendingRequests: string;
      pendingDescription: string;
      currentPlan: string;
      requestedPlan: string;
      message: string;
      approve: string;
      reject: string;
      requestHistory: string;
      editPlan: string;
      editPlanDescription: string;
      newPlanDescription: string;
      planName: string;
      planDescription: string;
      planDescriptionPlaceholder: string;
      priceLabel: string;
      sortOrder: string;
      limits: string;
      maxEventsLabel: string;
      maxParticipantsLabel: string;
      maxTotemsLabel: string;
      maxMembersLabel: string;
      checkInPointsLabel: string;
      featuresOptions: string;
      facialDescription: string;
      qrCodeDescription: string;
      customPlan: string;
      customPlanDescription: string;
      activePlan: string;
      activeDescription: string;
      createPlan: string;
      planSaveError: string;
      planUpdated: string;
      planCreated: string;
      planDeleteTitle: string;
      planDeleteDescription: string;
      planDeleted: string;
      planDeleteError: string;
      planDeactivated: string;
      planActivated: string;
      planToggleError: string;
      requestResolveError: string;
      requestApproved: string;
      requestRejected: string;
    };
    orgView: {
      currentPlan: string;
      usage: string;
      usageDescription: string;
      events: string;
      totems: string;
      participantsPerEvent: string;
    };
  };
  settings: {
    title: string;
    description: string;
    personalInfo: string;
    nameLabel: string;
    emailLabel: string;
    roleLabel: string;
    memberSince: string;
  };
  notifications: {
    title: string;
    markAllRead: string;
    noNotifications: string;
    now: string;
    types: {
      plan_request: string;
      plan_approved: string;
      plan_rejected: string;
      limit_warning: string;
      expiration_warning: string;
      new_member: string;
      event_created: string;
      system_message: string;
    };
  };
  confirm: {
    deleteTitle: string;
    deleteDescription: string;
    deleteConfirmLabel: string;
    deleteConfirmPlaceholder: string;
    typeTo: string;
    toConfirm: string;
    actionCannotBeUndone: string;
    areYouSure: string;
  };
  toast: {
    success: string;
    error: string;
    warning: string;
    info: string;
    errorOccurred: string;
    actionCompleted: string;
    saved: string;
    deleted: string;
    created: string;
    updated: string;
    limitReached: string;
    expired: string;
  };
  export: {
    excel: string;
    pdf: string;
    exporting: string;
    exportComplete: string;
  };
  languages: {
    pt: string;
    en: string;
    fr: string;
    es: string;
    zh: string;
  };
  labelConfig: {
    paper: {
      title: string;
      description: string;
      preset: string;
      selectSize: string;
      width: string;
      height: string;
      orientation: string;
      portrait: string;
      landscape: string;
      font: string;
      bgColor: string;
      textColor: string;
    };
    items: {
      title: string;
      description: string;
      fiventsLogo: string;
      orgLogo: string;
      name: string;
      company: string;
      jobTitle: string;
      qrCode: string;
      required: string;
      visible: string;
      hidden: string;
    };
    position: {
      title: string;
      width: string;
      height: string;
      fontSize: string;
      fontWeight: string;
      normal: string;
      bold: string;
      textAlign: string;
      left: string;
      center: string;
      right: string;
    };
    printer: {
      title: string;
      type: string;
      thermal: string;
      inkjet: string;
      laser: string;
      speed: string;
      copies: string;
    };
    preview: {
      title: string;
      dragHint: string;
    };
    actions: {
      reset: string;
    };
    presets: {
      thermal62x100: string;
      thermal80x80: string;
      thermal57x40: string;
      badge86x54: string;
      label100x150: string;
    };
  };
  totemManagement: {
    title: string;
    description: string;
    noTotems: string;
    stats: {
      total: string;
    };
    status: {
      maintenance: string;
    };
    columns: {
      event: string;
      checkInPoint: string;
      lastSignal: string;
      createdAt: string;
    };
    actions: {
      viewDetails: string;
      viewHistory: string;
      activate: string;
      deactivate: string;
    };
    confirmActivate: string;
    confirmDeactivate: string;
    detailsDescription: string;
    history: {
      title: string;
      description: string;
      noCheckIns: string;
      participant: string;
      company: string;
      method: string;
      dateTime: string;
    };
  };
};

export type Translations = Record<Locale, TranslationSchema>;
