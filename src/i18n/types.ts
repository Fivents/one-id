export type Locale = 'pt' | 'en' | 'fr' | 'es' | 'zh';

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
      emailPlaceholder: string;
      tokenCodeLabel: string;
      tokenCodePlaceholder: string;
      passwordLabel: string;
      loginButton: string;
      loginAsTotemButton: string;
      loggingIn: string;
      connectionError: string;
      invalidCredentials: string;
      invalidToken: string;
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
      plans: string;
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
      membersDescription: string;
      currentPlan: string;
      startedAt: string;
      expiresAt: string;
      noSubscription: string;
      assignSubscription: string;
      assignSubscriptionDescription: string;
      noPlansAvailable: string;
      createPlan: string;
      addMember: string;
      addMemberDescription: string;
      noMembers: string;
    };
    form: {
      createTitle: string;
      editTitle: string;
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
    messages: {
      createSuccess: string;
      updateSuccess: string;
      updateError: string;
      deleteSuccess: string;
      deleteError: string;
      deleteConfirmDescription: string;
      activateSuccess: string;
      deactivateSuccess: string;
      statusError: string;
      activateConfirm: string;
      deactivateConfirm: string;
      inactiveWarning: string;
      subscriptionSuccess: string;
      subscriptionError: string;
      memberAddSuccess: string;
      memberAddError: string;
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
      organizationName: string;
      selectOrganization: string;
      createNewOrg: string;
      selectExistingOrg: string;
    };
    labels: {
      resetPassword: string;
      toggleActive: string;
      activate: string;
      deactivate: string;
      setupPending: string;
      superAdmin: string;
      clients: string;
    };
    memberships: {
      title: string;
      description: string;
      manage: string;
      selectOrg: string;
      addSuccess: string;
      addError: string;
      removeSuccess: string;
      removeError: string;
      cannotRemoveLast: string;
      loadError: string;
      roleUpdateSuccess: string;
      roleUpdateError: string;
    };
    messages: {
      createSuccess: string;
      updateSuccess: string;
      deleteSuccess: string;
      resetPasswordSuccess: string;
      createError: string;
      updateError: string;
      deleteError: string;
      resetPasswordError: string;
      deleteConfirmDescription: string;
      resetPasswordDescription: string;
    };
    tabs: {
      active: string;
      deleted: string;
    };
    bulk: {
      selected: string;
      deleteSelected: string;
      permanentDeleteSelected: string;
      selectAll: string;
      selectUser: string;
      deleteTitle: string;
      deleteDescription: string;
      permanentDeleteTitle: string;
      permanentDeleteDescription: string;
      error: string;
    };
    deleted: {
      noUsers: string;
      deletedAt: string;
      restore: string;
      permanentDelete: string;
    };
    restore: {
      title: string;
      description: string;
      success: string;
      error: string;
      confirm: string;
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
  adminTotems: {
    list: {
      title: string;
      description: string;
      newTotem: string;
    };
    form: {
      createTitle: string;
      editTitle: string;
      createDescription: string;
      editDescription: string;
      namePlaceholder: string;
      singleTab: string;
      bulkTab: string;
      namePrefix: string;
      namePrefixPlaceholder: string;
      namePrefixHint: string;
      count: string;
      countHint: string;
      createBulk: string;
    };
    columns: {
      price: string;
      discount: string;
      discountPercent: string;
      subscription: string;
      available: string;
      inUseBy: string;
      online: string;
      offline: string;
      accessCode: string;
    };
    status: {
      maintenance: string;
    };
    tabs: {
      active: string;
      deleted: string;
    };
    actions: {
      selectAll: string;
      clearSelection: string;
      bulkDelete: string;
      selected: string;
      generateCode: string;
      revokeCode: string;
      changeStatus: string;
    };
    messages: {
      createSuccess: string;
      bulkCreateSuccess: string;
      updateSuccess: string;
      deleteSuccess: string;
      hardDeleteSuccess: string;
      restoreSuccess: string;
      bulkDeleteSuccess: string;
      bulkHardDeleteSuccess: string;
      bulkDeleteConfirm: string;
      bulkHardDeleteConfirm: string;
      createError: string;
      updateError: string;
      deleteError: string;
      hardDeleteError: string;
      restoreError: string;
      deleteConfirmDescription: string;
      hardDeleteDescription: string;
      restoreDescription: string;
      generateCodeSuccess: string;
      generateCodeError: string;
      revokeCodeSuccess: string;
      revokeCodeError: string;
      revokeCodeConfirm: string;
      changeStatusSuccess: string;
      changeStatusError: string;
    };
    deleted: {
      noTotems: string;
      deletedAt: string;
      restore: string;
      permanentDelete: string;
      bulkPermanentDelete: string;
    };
  };
  adminPlans: {
    title: string;
    description: string;
    tabs: {
      plans: string;
      categories: string;
      features: string;
      usage: string;
    };
    fields: {
      name: string;
      description: string;
      price: string;
      discount: string;
      category: string;
      noCategory: string;
      sortOrder: string;
      active: string;
      custom: string;
      features: string;
      subscribers: string;
      code: string;
      type: string;
      color: string;
      plansCount: string;
      usedInPlans: string;
    };
    filters: {
      search: string;
      allCategories: string;
    };
    actions: {
      newPlan: string;
      manageFeatures: string;
      activate: string;
      deactivate: string;
    };
    form: {
      createTitle: string;
      editTitle: string;
      createDescription: string;
      editDescription: string;
    };
    messages: {
      noPlans: string;
      planCreated: string;
      planUpdated: string;
      planSaveError: string;
      planDeleted: string;
      planDeleteError: string;
      planActivated: string;
      planDeactivated: string;
      planToggleError: string;
      deleteTitle: string;
      deleteDescription: string;
      featuresUpdated: string;
      featuresUpdateError: string;
      featuresValidationError: string;
      categoryCreated: string;
      categoryUpdated: string;
      categorySaveError: string;
      categoryDeleted: string;
      categoryDeleteError: string;
      featureCreated: string;
      featureUpdated: string;
      featureSaveError: string;
      featureDeleted: string;
      featureDeleteError: string;
    };
    categories: {
      description: string;
      newCategory: string;
      noCategories: string;
      createTitle: string;
      editTitle: string;
      createDescription: string;
      editDescription: string;
      deleteTitle: string;
      deleteDescription: string;
    };
    features: {
      description: string;
      newFeature: string;
      noFeatures: string;
      createTitle: string;
      editTitle: string;
      createDescription: string;
      editDescription: string;
      deleteTitle: string;
      deleteDescription: string;
      namePlaceholder: string;
      manageTitle: string;
      manageDescription: string;
    };
    usage: {
      description: string;
      totalPlans: string;
      totalSubscriptions: string;
      totalFeatures: string;
      averagePrice: string;
      activeOrganizations: string;
      assignments: string;
      categories: string;
      planBreakdown: string;
      subscribers: string;
    };
  };
  pages: {
    organizationEvents: Record<string, string>;
    organizationPeople: Record<string, string>;
    eventDetail: Record<string, string>;
    adminOrganizations: Record<string, string>;
    adminOrganizationsTable: Record<string, string>;
    organizationDetail: Record<string, string>;
    peopleTable: Record<string, string>;
    eventsTable: Record<string, string>;
    adminTotemsPage: Record<string, string>;
    organizationTotems: Record<string, string>;
    adminTotemsTable: Record<string, string>;
    totemLogin: Record<string, string>;
    totemCredentialing: Record<string, string>;
  };
  tables: {
    labels: {
      name: string;
      slug: string;
      email: string;
      phone: string;
      status: string;
      startDate: string;
      endDate: string;
      participants: string;
      checkIns: string;
      createdAt: string;
      totems: string;
      actions: string;
      registeredAt: string;
      document: string;
    };
    actions: {
      viewDetails: string;
      edit: string;
      delete: string;
      activate: string;
      deactivate: string;
      publish: string;
      complete: string;
      cancel: string;
    };
    messages: {
      noResults: string;
      createFirst: string;
      searching: string;
    };
  };
  totem: {
    loginTitle: string;
    loginDescription: string;
    accessCodePlaceholder: string;
    loginButton: string;
    loginSuccess: string;
    loginError: string;
    credentialingPlaceholder: string;
    credentialingComingSoon: string;
    logout: string;
  };
};

export type Translations = Record<Locale, TranslationSchema>;
