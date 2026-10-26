'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  Edit,
  FileDown,
  FileSpreadsheet,
  FileUp,
  MoreHorizontal,
  ScanFace,
  Search,
  Settings,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { ImportPeopleDialog } from '@/components/organizations/people/import-people-dialog';
import { PeopleSettingsDialog } from '@/components/organizations/people/people-settings-dialog';
import { useConfirm } from '@/components/shared/confirm-dialog';
import { DEFAULT_PAGE_SIZE, ListPagination, type PageSize } from '@/components/shared/list-pagination';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { organizationPeopleSettingsClient, participantsClient, peopleClient } from '@/core/application/client-services';
import type {
  PaginatedPeopleResponse,
  PersonEventLinkResponse,
  PersonSummaryResponse,
} from '@/core/application/client-services/people-client.service';
import { extractFaceEmbedding } from '@/core/application/client-services/totem/face-embedding.client';
import { useApp, useAuth, useOrganization, usePermissions } from '@/core/application/contexts';
import type { CodeSourceFieldOption } from '@/core/communication/requests/organization-people-settings';
import { excelPeople } from '@/core/utils/excel-people';
import { getNameInitials } from '@/core/utils/get-name-initials';
import { useI18n } from '@/i18n';

const CODE_SOURCE_FIELD_LABELS: Record<CodeSourceFieldOption, string> = {
  NONE: '',
  DOCUMENT: 'documento',
  PHONE: 'telefone',
  EMAIL: 'e-mail',
};

type ActiveTab = 'active' | 'deleted';

type DocumentType = 'PASSPORT' | 'ID_CARD' | 'DRIVER_LICENSE' | 'OTHER';

async function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Invalid image file.'));
    };

    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export default function OrganizationPeoplePage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as string;

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isAppLoading } = useApp();
  const {
    organizations,
    activeOrganization,
    setActiveOrganization,
    isLoading: isOrganizationsLoading,
  } = useOrganization();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const { t, locale } = useI18n();

  const canView = isSuperAdmin() || hasPermission('PARTICIPANT_VIEW');
  const canManage = isSuperAdmin() || hasPermission('PARTICIPANT_MANAGE');

  const isLoadingPage = isAppLoading || isAuthLoading || isOrganizationsLoading;
  const hasOrganizationAccess = organizations.some((organization) => organization.id === organizationId);
  const shouldUseCurrentOrganization = hasOrganizationAccess || organizations.length === 0;

  const confirm = useConfirm();

  const [tab, setTab] = useState<ActiveTab>('active');
  const [search, setSearch] = useState('');

  const [activePage, setActivePage] = useState(1);
  const [deletedPage, setDeletedPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);

  const [isLoading, setIsLoading] = useState(false);
  const [activePeople, setActivePeople] = useState<PaginatedPeopleResponse>({
    items: [],
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [deletedPeople, setDeletedPeople] = useState<PaginatedPeopleResponse>({
    items: [],
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [selectedActiveIds, setSelectedActiveIds] = useState<Set<string>>(new Set());
  const [selectedDeletedIds, setSelectedDeletedIds] = useState<Set<string>>(new Set());

  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [peopleSettings, setPeopleSettings] = useState<{
    accessCodeSource: CodeSourceFieldOption;
    qrCodeSource: CodeSourceFieldOption;
  }>({ accessCodeSource: 'NONE', qrCodeSource: 'NONE' });
  const [editPerson, setEditPerson] = useState<PersonSummaryResponse | null>(null);
  const [manageEventsPerson, setManageEventsPerson] = useState<PersonSummaryResponse | null>(null);
  const [manageFacePerson, setManageFacePerson] = useState<PersonSummaryResponse | null>(null);
  const [personEvents, setPersonEvents] = useState<PersonEventLinkResponse[]>([]);
  const [isLoadingPersonEvents, setIsLoadingPersonEvents] = useState(false);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDocument, setFormDocument] = useState('');
  const [formDocumentType, setFormDocumentType] = useState<DocumentType | ''>('');
  const [formPhone, setFormPhone] = useState('');
  const [formQrCodeValue, setFormQrCodeValue] = useState('');
  const [formAccessCode, setFormAccessCode] = useState('');
  const [createFaceImageUrl, setCreateFaceImageUrl] = useState('');
  const [createFaceImageDataUrl, setCreateFaceImageDataUrl] = useState('');
  const [isCreateFaceCameraOpen, setIsCreateFaceCameraOpen] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const createFaceVideoRef = useRef<HTMLVideoElement | null>(null);
  const createFaceCameraStreamRef = useRef<MediaStream | null>(null);
  const [faceImageUrl, setFaceImageUrl] = useState('');
  const [faceImageDataUrl, setFaceImageDataUrl] = useState('');
  const [isFaceCameraOpen, setIsFaceCameraOpen] = useState(false);
  const [isSavingFace, setIsSavingFace] = useState(false);
  const faceVideoRef = useRef<HTMLVideoElement | null>(null);
  const faceCameraStreamRef = useRef<MediaStream | null>(null);

  const allActiveSelected = useMemo(() => {
    return activePeople.items.length > 0 && activePeople.items.every((person) => selectedActiveIds.has(person.id));
  }, [activePeople.items, selectedActiveIds]);

  const allDeletedSelected = useMemo(() => {
    return deletedPeople.items.length > 0 && deletedPeople.items.every((person) => selectedDeletedIds.has(person.id));
  }, [deletedPeople.items, selectedDeletedIds]);

  const loadPeople = useCallback(
    async (targetTab: ActiveTab) => {
      if (!organizationId) return;

      setIsLoading(true);
      try {
        if (targetTab === 'active') {
          const response = await peopleClient.listPeople({
            organizationId,
            page: activePage,
            pageSize,
            search,
          });

          if (!response.success) throw new Error(response.error.message);
          setActivePeople(response.data);
          setSelectedActiveIds(new Set());
        } else {
          const response = await peopleClient.listPeople({
            organizationId,
            page: deletedPage,
            pageSize,
            search,
            deleted: true,
          });

          if (!response.success) throw new Error(response.error.message);
          setDeletedPeople(response.data);
          setSelectedDeletedIds(new Set());
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : t('pages.organizationPeople.loadPeopleError');
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId, activePage, deletedPage, pageSize, search, t],
  );

  const loadPersonEvents = useCallback(
    async (personId: string) => {
      setIsLoadingPersonEvents(true);
      try {
        const response = await peopleClient.listPersonEvents(personId);
        if (!response.success) throw new Error(response.error.message);
        setPersonEvents(response.data);
      } catch (error) {
        const message = error instanceof Error ? error.message : t('pages.organizationPeople.loadPersonEventsError');
        toast.error(message);
      } finally {
        setIsLoadingPersonEvents(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (!isLoadingPage && (!isAuthenticated || !canView)) {
      router.replace('/dashboard');
    }
  }, [isLoadingPage, isAuthenticated, canView, router]);

  useEffect(() => {
    if (!isAuthenticated || !canView) return;

    if (!shouldUseCurrentOrganization) {
      if (organizations.length > 0 && organizations[0] && organizations[0].id !== organizationId) {
        router.replace(`/organizations/${organizations[0].id}/people`);
      }
      return;
    }

    void loadPeople(tab);
  }, [isAuthenticated, canView, shouldUseCurrentOrganization, organizations, organizationId, router, tab, loadPeople]);

  useEffect(() => {
    if (!isAuthenticated || !canView || !organizationId) return;

    organizationPeopleSettingsClient.getSettings(organizationId).then((response) => {
      if (response.success) {
        setPeopleSettings({
          accessCodeSource: response.data.accessCodeSource,
          qrCodeSource: response.data.qrCodeSource,
        });
      }
    });
  }, [isAuthenticated, canView, organizationId, settingsOpen]);

  const handleOrganizationChange = useCallback(
    (nextOrganizationId: string) => {
      const selectedOrganization = organizations.find((organization) => organization.id === nextOrganizationId);
      if (!selectedOrganization) return;

      setActiveOrganization(selectedOrganization);
      router.push(`/organizations/${selectedOrganization.id}/people`);
    },
    [organizations, router, setActiveOrganization],
  );

  const stopCreateFaceCamera = useCallback(() => {
    const stream = createFaceCameraStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      createFaceCameraStreamRef.current = null;
    }
    setIsCreateFaceCameraOpen(false);
  }, []);

  const resetForm = useCallback(() => {
    setFormName('');
    setFormEmail('');
    setFormDocument('');
    setFormDocumentType('');
    setFormPhone('');
    setFormQrCodeValue('');
    setFormAccessCode('');
    setCreateFaceImageUrl('');
    setCreateFaceImageDataUrl('');
    stopCreateFaceCamera();
  }, [stopCreateFaceCamera]);

  useEffect(() => {
    return () => {
      stopCreateFaceCamera();
    };
  }, [stopCreateFaceCamera]);

  useEffect(() => {
    if (!isCreateFaceCameraOpen || !createFaceVideoRef.current || !createFaceCameraStreamRef.current) {
      return;
    }

    const video = createFaceVideoRef.current;
    video.srcObject = createFaceCameraStreamRef.current;
    void video.play().catch(() => null);
  }, [isCreateFaceCameraOpen]);

  const openCreateFaceCamera = useCallback(async () => {
    try {
      stopCreateFaceCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      createFaceCameraStreamRef.current = stream;
      setIsCreateFaceCameraOpen(true);
      setCreateFaceImageUrl('');
    } catch {
      toast.error(t('pages.organizationPeople.webcamAccessError'));
    }
  }, [stopCreateFaceCamera, t]);

  const captureCreateFacePhoto = useCallback(() => {
    const video = createFaceVideoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error(t('pages.organizationPeople.cameraNotReady'));
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      toast.error(t('pages.organizationPeople.capturePhotoError'));
      return;
    }

    // Mirror horizontally to match video preview (scaleX(-1))
    context.scale(-1, 1);
    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    const captured = canvas.toDataURL('image/jpeg', 0.9);
    setCreateFaceImageDataUrl(captured);
    setCreateFaceImageUrl('');
    stopCreateFaceCamera();
  }, [stopCreateFaceCamera, t]);

  const handleCreateFaceFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const file = input.files?.[0];
      if (!file) {
        return;
      }

      try {
        const dataUrl = await readImageFileAsDataUrl(file);
        setCreateFaceImageDataUrl(dataUrl);
        setCreateFaceImageUrl('');
        stopCreateFaceCamera();
      } catch {
        toast.error(t('pages.organizationPeople.capturePhotoError'));
      } finally {
        input.value = '';
      }
    },
    [stopCreateFaceCamera, t],
  );

  const openEditModal = useCallback((person: PersonSummaryResponse) => {
    setEditPerson(person);
    setFormName(person.name);
    setFormEmail(person.email);
    setFormDocument(person.document ?? '');
    setFormDocumentType((person.documentType as DocumentType | null) ?? '');
    setFormPhone(person.phone ?? '');
    setFormQrCodeValue(person.qrCodeValue ?? '');
    setFormAccessCode(person.accessCode ?? '');
  }, []);

  const handleCreateOrUpdate = useCallback(
    async (isEdit: boolean) => {
      if (!canManage) return;

      setIsSubmittingForm(true);
      try {
        if (isEdit && editPerson) {
          const response = await peopleClient.updatePerson(editPerson.id, {
            name: formName,
            email: formEmail,
            document: formDocument || null,
            documentType: formDocumentType || null,
            phone: formPhone || null,
            qrCodeValue: formQrCodeValue.trim() || null,
            accessCode: formAccessCode.trim().toUpperCase() || null,
          });

          if (!response.success) throw new Error(response.error.message);
          toast.success(t('pages.organizationPeople.personUpdatedSuccess'));
          setEditPerson(null);
        } else {
          const response = await peopleClient.createPerson({
            name: formName,
            email: formEmail,
            document: formDocument || null,
            documentType: formDocumentType || null,
            phone: formPhone || null,
            qrCodeValue: formQrCodeValue.trim() || null,
            accessCode: formAccessCode.trim().toUpperCase() || null,
            organizationId,
          });

          if (!response.success) throw new Error(response.error.message);

          const normalizedFaceImageUrl = createFaceImageUrl.trim();
          const normalizedFaceImageDataUrl = createFaceImageDataUrl.trim();
          if (normalizedFaceImageUrl || normalizedFaceImageDataUrl) {
            const result = await extractFaceEmbedding(
              {
                imageDataUrl: normalizedFaceImageDataUrl || undefined,
                imageUrl: normalizedFaceImageUrl || undefined,
              },
              {
                requireSingleFace: true,
                maxFaces: 1,
                minFaceSize: 56,
                minDetectionConfidence: 0.45,
              },
            );

            const { embedding, faceDetectionData } = result;

            const faceResponse = await participantsClient.registerFace({
              personId: response.data.id,
              imageUrl: normalizedFaceImageUrl || undefined,
              imageDataUrl: normalizedFaceImageDataUrl || undefined,
              embedding,
              embeddingModel: 'Transformers.js ArcFace (512d)',
              faceDetectionData,
            });

            if (!faceResponse.success) {
              const errorMsg = faceResponse.error?.details
                ? faceResponse.error.details.map((d) => d.message).join('; ')
                : faceResponse.error?.message;
              throw new Error(errorMsg || 'Failed to register face');
            }
          }

          toast.success(t('pages.organizationPeople.personCreatedSuccess'));
          setCreateOpen(false);
        }

        resetForm();
        await loadPeople(tab);
      } catch (error) {
        const message = error instanceof Error ? error.message : t('pages.organizationPeople.savePersonError');
        toast.error(message);
      } finally {
        setIsSubmittingForm(false);
      }
    },
    [
      canManage,
      editPerson,
      formName,
      formEmail,
      formDocument,
      formDocumentType,
      formPhone,
      formQrCodeValue,
      formAccessCode,
      createFaceImageUrl,
      createFaceImageDataUrl,
      organizationId,
      resetForm,
      loadPeople,
      tab,
      t,
    ],
  );

  const handleSoftDelete = useCallback(
    async (person: PersonSummaryResponse) => {
      if (!canManage) return;

      const accepted = await confirm.confirm({
        title: t('pages.organizationPeople.deletePersonTitle'),
        description: t('pages.organizationPeople.deletePersonDescription').replace('{name}', person.name),
        confirmLabel: t('pages.organizationPeople.deletePersonConfirm'),
        variant: 'destructive',
      });

      if (!accepted) return;

      const response = await peopleClient.softDeletePerson(person.id);
      if (!response.success) {
        toast.error(response.error.message);
        return;
      }

      toast.success(t('pages.organizationPeople.personDeletedSuccess'));
      await loadPeople('active');
      await loadPeople('deleted');
    },
    [canManage, confirm, loadPeople, t],
  );

  const handleHardDelete = useCallback(
    async (person: PersonSummaryResponse) => {
      if (!canManage) return;

      const accepted = await confirm.confirm({
        title: t('pages.organizationPeople.hardDeletePersonTitle'),
        description: t('pages.organizationPeople.hardDeletePersonDescription').replace('{name}', person.name),
        confirmLabel: t('pages.organizationPeople.hardDeletePersonConfirm'),
        variant: 'destructive',
      });

      if (!accepted) return;

      const response = await peopleClient.hardDeletePerson(person.id);
      if (!response.success) {
        toast.error(response.error.message);
        return;
      }

      toast.success(t('pages.organizationPeople.personHardDeletedSuccess'));
      await loadPeople('deleted');
    },
    [canManage, confirm, loadPeople, t],
  );

  const handleBulkSoftDelete = useCallback(async () => {
    if (!canManage || selectedActiveIds.size === 0) return;

    const accepted = await confirm.confirm({
      title: t('pages.organizationPeople.deleteSelectedTitle'),
      description: t('pages.organizationPeople.deleteSelectedDescription').replace(
        '{count}',
        String(selectedActiveIds.size),
      ),
      confirmLabel: t('pages.organizationPeople.deleteSelectedConfirm'),
      variant: 'destructive',
    });

    if (!accepted) return;

    const response = await peopleClient.bulkSoftDelete(organizationId, [...selectedActiveIds]);
    if (!response.success) {
      toast.error(response.error.message);
      return;
    }

    toast.success(t('pages.organizationPeople.deleteSelectedSuccess'));
    await loadPeople('active');
    await loadPeople('deleted');
  }, [canManage, confirm, selectedActiveIds, organizationId, loadPeople, t]);

  // Deletes every active person matching the current search, across all pages. The server
  // re-checks the count inside a transaction, so the number typed here is the number removed.
  const handleDeleteAll = useCallback(async () => {
    const total = activePeople.total;
    if (!canManage || total === 0) return;

    const term = search.trim();
    const count = total.toLocaleString(locale);
    const accepted = await confirm.confirm({
      title: t('nav.shell.listDeleteAllTitle', { count }),
      description: term
        ? t('nav.shell.listDeleteAllDescriptionFiltered', { count, search: term })
        : t('nav.shell.listDeleteAllDescription', { count }),
      confirmLabel: t('nav.shell.listDeleteAllConfirm'),
      variant: 'destructive',
      requireText: String(total),
    });
    if (!accepted) return;

    const response = await peopleClient.deleteAllPeople({
      organizationId,
      search: term || undefined,
      expectedCount: total,
    });
    if (!response.success) {
      const actual = response.error.meta?.actual;
      toast.error(
        response.error.code === 'BULK_DELETE_COUNT_MISMATCH' && typeof actual === 'number'
          ? t('nav.shell.listDeleteAllChanged', { expected: count, actual: actual.toLocaleString(locale) })
          : t('nav.shell.listDeleteAllError'),
      );
      await loadPeople('active');
      return;
    }

    toast.success(t('nav.shell.listDeleteAllSuccess', { count: response.data.deleted.toLocaleString(locale) }));
    setActivePage(1);
    await loadPeople('active');
    await loadPeople('deleted');
  }, [activePeople.total, canManage, confirm, loadPeople, locale, organizationId, search, t]);

  const handleBulkHardDelete = useCallback(async () => {
    if (!canManage || selectedDeletedIds.size === 0) return;

    const accepted = await confirm.confirm({
      title: t('pages.organizationPeople.hardDeleteSelectedTitle'),
      description: t('pages.organizationPeople.hardDeleteSelectedDescription').replace(
        '{count}',
        String(selectedDeletedIds.size),
      ),
      confirmLabel: t('pages.organizationPeople.hardDeleteSelectedConfirm'),
      variant: 'destructive',
    });

    if (!accepted) return;

    const response = await peopleClient.bulkHardDelete(organizationId, [...selectedDeletedIds]);
    if (!response.success) {
      toast.error(response.error.message);
      return;
    }

    toast.success(t('pages.organizationPeople.hardDeleteSelectedSuccess'));
    await loadPeople('deleted');
  }, [canManage, confirm, selectedDeletedIds, organizationId, loadPeople, t]);

  const togglePersonEventLink = useCallback(
    async (event: PersonEventLinkResponse, linked: boolean) => {
      if (!manageEventsPerson || !canManage) return;

      const response = linked
        ? await peopleClient.unlinkPersonFromEvent(manageEventsPerson.id, event.id)
        : await peopleClient.linkPersonToEvent(manageEventsPerson.id, event.id);

      if (!response.success) {
        toast.error(response.error.message);
        return;
      }

      setPersonEvents((prev) => prev.map((item) => (item.id === event.id ? { ...item, linked: !linked } : item)));
      toast.success(
        linked ? t('pages.organizationPeople.unlinkedFromEvent') : t('pages.organizationPeople.linkedToEvent'),
      );
      await loadPeople('active');
    },
    [manageEventsPerson, canManage, loadPeople, t],
  );

  const stopFaceCamera = useCallback(() => {
    const stream = faceCameraStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      faceCameraStreamRef.current = null;
    }
    setIsFaceCameraOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      stopFaceCamera();
    };
  }, [stopFaceCamera]);

  const openFaceCamera = useCallback(async () => {
    try {
      stopFaceCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      faceCameraStreamRef.current = stream;
      setIsFaceCameraOpen(true);
      setFaceImageUrl('');
    } catch {
      toast.error(t('pages.organizationPeople.webcamAccessError'));
    }
  }, [stopFaceCamera, t]);

  useEffect(() => {
    if (!isFaceCameraOpen || !faceVideoRef.current || !faceCameraStreamRef.current) {
      return;
    }

    const video = faceVideoRef.current;
    video.srcObject = faceCameraStreamRef.current;
    void video.play().catch(() => null);
  }, [isFaceCameraOpen]);

  const captureFacePhoto = useCallback(() => {
    const video = faceVideoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error(t('pages.organizationPeople.cameraNotReady'));
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      toast.error(t('pages.organizationPeople.capturePhotoError'));
      return;
    }

    // Mirror horizontally to match video preview (scaleX(-1))
    context.scale(-1, 1);
    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    const captured = canvas.toDataURL('image/jpeg', 0.9);
    setFaceImageDataUrl(captured);
    setFaceImageUrl('');
    stopFaceCamera();
  }, [stopFaceCamera, t]);

  const handleFaceFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const file = input.files?.[0];
      if (!file) {
        return;
      }

      try {
        const dataUrl = await readImageFileAsDataUrl(file);
        setFaceImageDataUrl(dataUrl);
        setFaceImageUrl('');
        stopFaceCamera();
      } catch {
        toast.error(t('pages.organizationPeople.capturePhotoError'));
      } finally {
        input.value = '';
      }
    },
    [stopFaceCamera, t],
  );

  const handleSaveFace = useCallback(async () => {
    if (!manageFacePerson) return;

    const normalizedImageUrl = faceImageUrl.trim();
    const normalizedImageDataUrl = faceImageDataUrl.trim();

    if (!normalizedImageUrl && !normalizedImageDataUrl) {
      toast.error(t('pages.organizationPeople.provideImageSource'));
      return;
    }

    setIsSavingFace(true);
    try {
      const result = await extractFaceEmbedding(
        {
          imageDataUrl: normalizedImageDataUrl || undefined,
          imageUrl: normalizedImageUrl || undefined,
        },
        {
          requireSingleFace: true,
          maxFaces: 1,
          minFaceSize: 56,
          minDetectionConfidence: 0.45,
        },
      );

      const { embedding, faceDetectionData } = result;

      if (manageFacePerson.faceId) {
        const response = await participantsClient.replaceFaceImage(manageFacePerson.faceId, {
          imageUrl: normalizedImageUrl || undefined,
          imageDataUrl: normalizedImageDataUrl || undefined,
          embedding,
          embeddingModel: 'Transformers.js ArcFace (512d)',
          faceDetectionData,
          isActive: true,
        });

        if (!response.success) {
          const errorMsg = response.error?.details
            ? response.error.details.map((d) => d.message).join('; ')
            : response.error?.message;
          throw new Error(errorMsg || 'Failed to update face image');
        }
      } else {
        const response = await participantsClient.registerFace({
          personId: manageFacePerson.id,
          imageUrl: normalizedImageUrl || undefined,
          imageDataUrl: normalizedImageDataUrl || undefined,
          embedding,
          embeddingModel: 'Transformers.js ArcFace (512d)',
          faceDetectionData,
        });

        if (!response.success) {
          const errorMsg = response.error?.details
            ? response.error.details.map((d) => d.message).join('; ')
            : response.error?.message;
          throw new Error(errorMsg || 'Failed to register face');
        }
      }

      toast.success(
        manageFacePerson.faceId
          ? t('pages.organizationPeople.faceImageUpdated')
          : t('pages.organizationPeople.faceRegistered'),
      );
      setManageFacePerson(null);
      setFaceImageUrl('');
      setFaceImageDataUrl('');
      stopFaceCamera();
      await loadPeople('active');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.organizationPeople.saveFaceError');
      toast.error(message);
    } finally {
      setIsSavingFace(false);
    }
  }, [manageFacePerson, faceImageUrl, faceImageDataUrl, stopFaceCamera, t, loadPeople]);

  const handleExport = useCallback(async () => {
    if (!organizationId) return;

    try {
      const response = await peopleClient.exportPeople(organizationId);
      if (!response.success) {
        toast.error('Erro ao exportar pessoas.');
        return;
      }

      const people = response.data || [];
      const orgName = activeOrganization?.name || 'pessoas';
      excelPeople.exportToExcel(people, orgName);
      toast.success('Planilha exportada com sucesso.');
    } catch {
      toast.error('Erro ao exportar pessoas.');
    }
  }, [organizationId, activeOrganization]);

  const handleDownloadTemplate = useCallback(() => {
    excelPeople.generateTemplate();
  }, []);

  if (isLoadingPage || !isAuthenticated || !canView) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title={t('pages.organizationPeople.title')}
        description={`${t('pages.organizationPeople.subtitlePrefix')} ${
          activeOrganization?.name ?? t('pages.organizationPeople.subtitleFallback')
        }`}
        actions={
          <>
            {organizations.length > 1 && (
              <Select value={organizationId} onValueChange={handleOrganizationChange}>
                <SelectTrigger className="w-full sm:w-56" aria-label={t('pages.organizationPeople.selectOrganization')}>
                  <SelectValue placeholder={t('pages.organizationPeople.selectOrganization')} />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((organization) => (
                    <SelectItem key={organization.id} value={organization.id}>
                      {organization.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {canManage && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  title={t('pages.organizationPeople.peopleSettingsHint')}
                  aria-label={t('pages.organizationPeople.peopleSettingsHint')}
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <FileSpreadsheet className="h-4 w-4" />
                      {t('pages.organizationPeople.peopleSpreadsheetMenu')}
                      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setImportOpen(true)}>
                      <FileUp className="h-4 w-4" />
                      {t('pages.organizationPeople.importSpreadsheet')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExport}>
                      <FileSpreadsheet className="h-4 w-4" />
                      {t('pages.organizationPeople.exportSpreadsheet')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDownloadTemplate}>
                      <FileDown className="h-4 w-4" />
                      {t('pages.organizationPeople.downloadTemplate')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={() => {
                    resetForm();
                    setCreateOpen(true);
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  {t('pages.organizationPeople.newPerson')}
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setActivePage(1);
              setDeletedPage(1);
            }}
            placeholder={t('pages.organizationPeople.searchPlaceholder')}
            aria-label={t('pages.organizationPeople.searchPlaceholder')}
            className="pl-9"
          />
        </div>
        {canManage && tab === 'active' && activePeople.total > 0 && (
          <Button variant="destructive-ghost" size="sm" onClick={() => void handleDeleteAll()} disabled={isLoading}>
            <Trash2 className="h-4 w-4" />
            {t('nav.shell.listDeleteAll')}
            <span className="tabular-nums">({activePeople.total.toLocaleString(locale)})</span>
          </Button>
        )}
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as ActiveTab);
        }}
      >
        <TabsList>
          <TabsTrigger value="active">{t('pages.organizationPeople.tabActive')}</TabsTrigger>
          <TabsTrigger value="deleted">{t('pages.organizationPeople.tabDeleted')}</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3">
          {selectedActiveIds.size > 0 && canManage && (
            <div className="bg-muted/40 flex items-center justify-between rounded-lg border px-4 py-2">
              <span className="text-muted-foreground text-sm">
                {t('pages.organizationPeople.selectedCount').replace('{count}', String(selectedActiveIds.size))}
              </span>
              <Button size="sm" variant="destructive" onClick={handleBulkSoftDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('pages.organizationPeople.deleteSelectedButton')}
              </Button>
            </div>
          )}

          <div className="bg-card overflow-hidden rounded-xl border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      checked={allActiveSelected}
                      onCheckedChange={() => {
                        if (allActiveSelected) {
                          setSelectedActiveIds(new Set());
                        } else {
                          setSelectedActiveIds(new Set(activePeople.items.map((person) => person.id)));
                        }
                      }}
                      aria-label={t('pages.eventDetail.selectAllOnPage')}
                    />
                  </TableHead>
                  <TableHead>{t('pages.organizationPeople.thName')}</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {t('pages.organizationPeople.peopleContactColumn')}
                  </TableHead>
                  <TableHead className="hidden text-center sm:table-cell">
                    {t('pages.organizationPeople.thEvents')}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t('pages.organizationPeople.peopleCredentialsColumn')}
                  </TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">{t('pages.organizationPeople.thActions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={6} className="py-3 pl-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-8 rounded-full" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-3.5 w-40" />
                            <Skeleton className="h-3 w-56" />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : activePeople.items.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl">
                          <Users className="size-5" />
                        </span>
                        <p className="text-muted-foreground text-sm">{t('pages.organizationPeople.noPeopleFound')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  activePeople.items.map((person) => (
                    <TableRow key={person.id} data-state={selectedActiveIds.has(person.id) ? 'selected' : undefined}>
                      <TableCell className="pl-4">
                        <Checkbox
                          checked={selectedActiveIds.has(person.id)}
                          onCheckedChange={() => {
                            setSelectedActiveIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(person.id)) next.delete(person.id);
                              else next.add(person.id);
                              return next;
                            });
                          }}
                          aria-label={person.name}
                        />
                      </TableCell>
                      <TableCell className="max-w-[300px] py-2.5">
                        <div className="flex items-center gap-3">
                          <span
                            className={`relative flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                              person.faceId
                                ? 'bg-primary/10 text-violet-700 dark:text-violet-300'
                                : 'bg-muted text-muted-foreground'
                            }`}
                            title={
                              person.faceId
                                ? t('pages.organizationPeople.peopleFaceRegistered')
                                : t('pages.organizationPeople.peopleFaceMissing')
                            }
                          >
                            {getNameInitials(person.name)}
                            {person.faceId && (
                              <span className="bg-card absolute -right-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-full">
                                <ScanFace className="text-primary size-3" aria-hidden />
                              </span>
                            )}
                            <span className="sr-only">
                              {person.faceId
                                ? t('pages.organizationPeople.peopleFaceRegistered')
                                : t('pages.organizationPeople.peopleFaceMissing')}
                            </span>
                          </span>
                          <div className="min-w-0">
                            {canManage ? (
                              <button
                                type="button"
                                onClick={() => openEditModal(person)}
                                className="hover:text-primary focus-visible:ring-ring/50 block max-w-full truncate rounded-sm text-left font-medium transition-colors outline-none focus-visible:ring-2"
                              >
                                {person.name}
                              </button>
                            ) : (
                              <p className="truncate font-medium">{person.name}</p>
                            )}
                            <p className="text-muted-foreground truncate text-xs">{person.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm lg:table-cell">
                        {person.document || person.phone ? (
                          <>
                            {person.document && <p className="truncate">{person.document}</p>}
                            {person.phone && <p className="text-muted-foreground truncate text-xs">{person.phone}</p>}
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-center sm:table-cell">
                        <span className="bg-muted inline-flex min-w-7 justify-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
                          {person.eventsCount}
                        </span>
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs md:table-cell">
                        <div className="flex items-center gap-1" title={t('pages.organizationPeople.thCode')}>
                          {person.accessCode ?? '—'}
                          {peopleSettings.accessCodeSource !== 'NONE' && person.accessCodeProvenance === 'RANDOM' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle
                                  className="h-3.5 w-3.5 text-amber-500"
                                  aria-label={t('pages.organizationPeople.peopleRandomCodeHint')}
                                />
                              </TooltipTrigger>
                              <TooltipContent>{t('pages.organizationPeople.peopleRandomCodeHint')}</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <div
                          className="text-muted-foreground flex items-center gap-1"
                          title={t('pages.organizationPeople.thQR')}
                        >
                          {person.qrCodeValue ?? '—'}
                          {peopleSettings.qrCodeSource !== 'NONE' && person.qrCodeProvenance === 'RANDOM' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle
                                  className="h-3.5 w-3.5 text-amber-500"
                                  aria-label={t('pages.organizationPeople.peopleRandomQrHint')}
                                />
                              </TooltipTrigger>
                              <TooltipContent>{t('pages.organizationPeople.peopleRandomQrHint')}</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="pr-3">
                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`${t('pages.organizationPeople.peoplePersonActions')}: ${person.name}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => openEditModal(person)}>
                                <Edit className="h-4 w-4" />
                                {t('pages.organizationPeople.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setManageEventsPerson(person);
                                  loadPersonEvents(person.id);
                                }}
                              >
                                <Calendar className="h-4 w-4" />
                                {t('pages.organizationPeople.peopleManageEvents')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setManageFacePerson(person);
                                  setFaceImageUrl('');
                                  setFaceImageDataUrl('');
                                }}
                              >
                                <ScanFace className="h-4 w-4" />
                                {t('pages.organizationPeople.peopleRegisterFace')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onClick={() => handleSoftDelete(person)}>
                                <Trash2 className="h-4 w-4" />
                                {t('pages.organizationPeople.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <ListPagination
            page={activePeople.page}
            totalPages={activePeople.totalPages}
            total={activePeople.total}
            pageSize={pageSize}
            onPageChange={setActivePage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setActivePage(1);
              setDeletedPage(1);
            }}
            disabled={isLoading}
          />
        </TabsContent>

        <TabsContent value="deleted" className="space-y-3">
          {selectedDeletedIds.size > 0 && canManage && (
            <div className="bg-muted/40 flex items-center justify-between rounded-lg border px-4 py-2">
              <span className="text-muted-foreground text-sm">
                {t('pages.organizationPeople.selectedCount').replace('{count}', String(selectedDeletedIds.size))}
              </span>
              <Button size="sm" variant="destructive" onClick={handleBulkHardDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('pages.organizationPeople.hardDeleteSelectedButton')}
              </Button>
            </div>
          )}

          <div className="bg-card overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={allDeletedSelected}
                      onChange={() => {
                        if (allDeletedSelected) {
                          setSelectedDeletedIds(new Set());
                        } else {
                          setSelectedDeletedIds(new Set(deletedPeople.items.map((person) => person.id)));
                        }
                      }}
                      className="h-4 w-4"
                    />
                  </TableHead>
                  <TableHead>{t('pages.organizationPeople.thName')}</TableHead>
                  <TableHead>{t('pages.organizationPeople.thEmail')}</TableHead>
                  <TableHead>{t('pages.organizationPeople.thDeletedAt')}</TableHead>
                  <TableHead>{t('pages.organizationPeople.thActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                      {t('pages.organizationPeople.loading')}
                    </TableCell>
                  </TableRow>
                ) : deletedPeople.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                      {t('pages.organizationPeople.noDeletedPeople')}
                    </TableCell>
                  </TableRow>
                ) : (
                  deletedPeople.items.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedDeletedIds.has(person.id)}
                          onChange={() => {
                            setSelectedDeletedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(person.id)) next.delete(person.id);
                              else next.add(person.id);
                              return next;
                            });
                          }}
                          className="h-4 w-4"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{person.name}</TableCell>
                      <TableCell>{person.email}</TableCell>
                      <TableCell>
                        {person.deletedAt
                          ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
                              new Date(person.deletedAt),
                            )
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {canManage && (
                          <Button variant="destructive-ghost" size="sm" onClick={() => handleHardDelete(person)}>
                            <Trash2 className="h-3.5 w-3.5" />
                            {t('pages.organizationPeople.hardDelete')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <ListPagination
            page={deletedPeople.page}
            totalPages={deletedPeople.totalPages}
            total={deletedPeople.total}
            pageSize={pageSize}
            onPageChange={setDeletedPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setActivePage(1);
              setDeletedPage(1);
            }}
            disabled={isLoading}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.organizationPeople.createPersonTitle')}</DialogTitle>
            <DialogDescription>{t('pages.organizationPeople.createPersonDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t('pages.organizationPeople.labelName')}</Label>
              <Input value={formName} onChange={(event) => setFormName(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('pages.organizationPeople.labelEmail')}</Label>
              <Input type="email" value={formEmail} onChange={(event) => setFormEmail(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('pages.organizationPeople.labelDocument')}</Label>
              <Input value={formDocument} onChange={(event) => setFormDocument(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('pages.organizationPeople.labelDocumentType')}</Label>
              <Select
                value={formDocumentType}
                onValueChange={(value) => setFormDocumentType(value as DocumentType | '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('pages.organizationPeople.selectDocumentType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PASSPORT">{t('pages.organizationPeople.passport')}</SelectItem>
                  <SelectItem value="ID_CARD">{t('pages.organizationPeople.idCard')}</SelectItem>
                  <SelectItem value="DRIVER_LICENSE">{t('pages.organizationPeople.driverLicense')}</SelectItem>
                  <SelectItem value="OTHER">{t('pages.organizationPeople.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('pages.organizationPeople.labelPhone')}</Label>
              <Input value={formPhone} onChange={(event) => setFormPhone(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>QR Code</Label>
              <Input
                value={formQrCodeValue}
                disabled={peopleSettings.qrCodeSource !== 'NONE'}
                onChange={(event) => setFormQrCodeValue(event.target.value)}
              />
              {peopleSettings.qrCodeSource !== 'NONE' && (
                <p className="text-muted-foreground text-xs">
                  Gerado automaticamente a partir do {CODE_SOURCE_FIELD_LABELS[peopleSettings.qrCodeSource]} (settings
                  da organização).
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Código de acesso</Label>
              <Input
                value={formAccessCode}
                disabled={peopleSettings.accessCodeSource !== 'NONE'}
                onChange={(event) => setFormAccessCode(event.target.value.toUpperCase())}
              />
              {peopleSettings.accessCodeSource !== 'NONE' && (
                <p className="text-muted-foreground text-xs">
                  Gerado automaticamente a partir do {CODE_SOURCE_FIELD_LABELS[peopleSettings.accessCodeSource]}{' '}
                  (settings da organização).
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label>{t('pages.organizationPeople.faceImageUrlOptional')}</Label>
              <Input
                type="url"
                placeholder="https://..."
                value={createFaceImageUrl}
                onChange={(event) => {
                  setCreateFaceImageUrl(event.target.value);
                  if (event.target.value.trim()) {
                    setCreateFaceImageDataUrl('');
                    stopCreateFaceCamera();
                  }
                }}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="create-face-upload">Upload de imagem (opcional)</Label>
              <Input
                id="create-face-upload"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  void handleCreateFaceFileChange(event);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('pages.organizationPeople.faceWebcamOptional')}</Label>
              <div className="flex gap-2">
                {!isCreateFaceCameraOpen ? (
                  <Button type="button" variant="outline" onClick={openCreateFaceCamera}>
                    {t('pages.organizationPeople.openCamera')}
                  </Button>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={captureCreateFacePhoto}>
                      {t('pages.organizationPeople.capturePhoto')}
                    </Button>
                    <Button type="button" variant="ghost" onClick={stopCreateFaceCamera}>
                      {t('pages.organizationPeople.closeCamera')}
                    </Button>
                  </>
                )}
              </div>
              {isCreateFaceCameraOpen && (
                <video
                  ref={createFaceVideoRef}
                  className="w-full rounded-md border"
                  style={{ transform: 'scaleX(-1)' }}
                  autoPlay
                  playsInline
                  muted
                />
              )}
            </div>

            {(createFaceImageDataUrl || createFaceImageUrl.trim()) && (
              <div className="space-y-2">
                <Label>{t('pages.organizationPeople.facePreview')}</Label>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={createFaceImageDataUrl || createFaceImageUrl.trim()}
                  alt="Person face preview"
                  className="h-40 w-full rounded-md border object-cover"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('pages.organizationPeople.cancel')}
            </Button>
            <Button disabled={isSubmittingForm || !formName || !formEmail} onClick={() => handleCreateOrUpdate(false)}>
              {isSubmittingForm ? t('pages.organizationPeople.saving') : t('pages.organizationPeople.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editPerson}
        onOpenChange={(open) => {
          if (!open) {
            setEditPerson(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.organizationPeople.editPersonTitle')}</DialogTitle>
            <DialogDescription>{t('pages.organizationPeople.editPersonDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t('pages.organizationPeople.labelName')}</Label>
              <Input value={formName} onChange={(event) => setFormName(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('pages.organizationPeople.labelEmail')}</Label>
              <Input type="email" value={formEmail} onChange={(event) => setFormEmail(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('pages.organizationPeople.labelDocument')}</Label>
              <Input value={formDocument} onChange={(event) => setFormDocument(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('pages.organizationPeople.labelDocumentType')}</Label>
              <Select
                value={formDocumentType}
                onValueChange={(value) => setFormDocumentType(value as DocumentType | '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('pages.organizationPeople.selectDocumentType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PASSPORT">{t('pages.organizationPeople.passport')}</SelectItem>
                  <SelectItem value="ID_CARD">{t('pages.organizationPeople.idCard')}</SelectItem>
                  <SelectItem value="DRIVER_LICENSE">{t('pages.organizationPeople.driverLicense')}</SelectItem>
                  <SelectItem value="OTHER">{t('pages.organizationPeople.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('pages.organizationPeople.labelPhone')}</Label>
              <Input value={formPhone} onChange={(event) => setFormPhone(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>QR Code</Label>
              <Input value={formQrCodeValue} onChange={(event) => setFormQrCodeValue(event.target.value)} />
              <p className="text-muted-foreground text-xs">
                Editar aqui define um valor manual para esta pessoa, mesmo com a settings da organização ativa.
              </p>
            </div>
            <div className="space-y-1">
              <Label>Código de acesso</Label>
              <Input value={formAccessCode} onChange={(event) => setFormAccessCode(event.target.value.toUpperCase())} />
              <p className="text-muted-foreground text-xs">
                Editar aqui define um valor manual para esta pessoa, mesmo com a settings da organização ativa.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditPerson(null);
                resetForm();
              }}
            >
              {t('pages.organizationPeople.cancel')}
            </Button>
            <Button disabled={isSubmittingForm || !formName || !formEmail} onClick={() => handleCreateOrUpdate(true)}>
              {isSubmittingForm ? t('pages.organizationPeople.saving') : t('pages.organizationPeople.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!manageEventsPerson} onOpenChange={(open) => !open && setManageEventsPerson(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('pages.organizationPeople.manageEventsTitle')}</DialogTitle>
            <DialogDescription>
              {manageEventsPerson
                ? t('pages.organizationPeople.manageEventsDescriptionWithName').replace(
                    '{name}',
                    manageEventsPerson.name,
                  )
                : t('pages.organizationPeople.manageEventsDescriptionFallback')}
            </DialogDescription>
          </DialogHeader>

          {isLoadingPersonEvents ? (
            <p className="text-muted-foreground text-sm">{t('pages.organizationPeople.loadingEvents')}</p>
          ) : (
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {personEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
                        new Date(event.startsAt),
                      )}{' '}
                      -{' '}
                      {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
                        new Date(event.endsAt),
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{event.status}</Badge>
                    <Switch checked={event.linked} onCheckedChange={() => togglePersonEventLink(event, event.linked)} />
                  </div>
                </div>
              ))}

              {personEvents.length === 0 && (
                <p className="text-muted-foreground text-sm">{t('pages.organizationPeople.noEventsFound')}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageEventsPerson(null)}>
              {t('pages.organizationPeople.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!manageFacePerson}
        onOpenChange={(open) => {
          if (!open) {
            setManageFacePerson(null);
            setFaceImageUrl('');
            setFaceImageDataUrl('');
            stopFaceCamera();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {manageFacePerson?.faceId
                ? t('pages.organizationPeople.updateFaceImageTitle')
                : t('pages.organizationPeople.registerFaceTitle')}
            </DialogTitle>
            <DialogDescription>{t('pages.organizationPeople.manageFaceDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="person-face-url">{t('pages.organizationPeople.imageUrl')}</Label>
              <Input
                id="person-face-url"
                type="url"
                placeholder="https://..."
                value={faceImageUrl}
                onChange={(event) => {
                  setFaceImageUrl(event.target.value);
                  if (event.target.value.trim()) {
                    setFaceImageDataUrl('');
                    stopFaceCamera();
                  }
                }}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="person-face-upload">Upload de imagem (opcional)</Label>
              <Input
                id="person-face-upload"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  void handleFaceFileChange(event);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('pages.organizationPeople.webcam')}</Label>
              <div className="flex gap-2">
                {!isFaceCameraOpen ? (
                  <Button type="button" variant="outline" onClick={openFaceCamera}>
                    {t('pages.organizationPeople.openCamera')}
                  </Button>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={captureFacePhoto}>
                      {t('pages.organizationPeople.capturePhoto')}
                    </Button>
                    <Button type="button" variant="ghost" onClick={stopFaceCamera}>
                      {t('pages.organizationPeople.closeCamera')}
                    </Button>
                  </>
                )}
              </div>

              {isFaceCameraOpen && (
                <video
                  ref={faceVideoRef}
                  className="w-full rounded-md border"
                  style={{ transform: 'scaleX(-1)' }}
                  autoPlay
                  playsInline
                  muted
                />
              )}
            </div>

            {(faceImageDataUrl || faceImageUrl.trim()) && (
              <div className="space-y-2">
                <Label>{t('pages.organizationPeople.preview')}</Label>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={faceImageDataUrl || faceImageUrl.trim()}
                  alt="Face preview"
                  className="h-48 w-full rounded-md border object-cover"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setManageFacePerson(null);
                setFaceImageUrl('');
                setFaceImageDataUrl('');
                stopFaceCamera();
              }}
            >
              {t('pages.organizationPeople.cancel')}
            </Button>
            <Button onClick={handleSaveFace} disabled={isSavingFace}>
              {isSavingFace
                ? t('pages.organizationPeople.saving')
                : manageFacePerson?.faceId
                  ? t('pages.organizationPeople.updateFace')
                  : t('pages.organizationPeople.registerFace')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportPeopleDialog open={importOpen} onOpenChange={setImportOpen} organizationId={organizationId} />

      <PeopleSettingsDialog
        open={settingsOpen}
        onOpenChange={(nextOpen) => {
          setSettingsOpen(nextOpen);
          if (!nextOpen) void loadPeople(tab);
        }}
        organizationId={organizationId}
      />
    </div>
  );
}
