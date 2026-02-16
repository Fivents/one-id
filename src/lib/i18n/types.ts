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
      orgOverview: string;
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
      date: string;
      ofMax: string;
      ofParticipants: string;
      eventParticipants: string;
      face: string;
      faceRegistered: string;
      waiting: string;
      add: string;
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
};

export type Translations = Record<Locale, TranslationSchema>;
