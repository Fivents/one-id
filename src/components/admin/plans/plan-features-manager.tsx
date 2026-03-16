'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { AdminPlanResponse } from '@/core/application/client-services/admin-plans-client.service';
import { useAdminPlans } from '@/core/application/contexts';
import { useI18n } from '@/i18n';

interface PlanFeaturesManagerProps {
  plan: AdminPlanResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FeatureValue {
  featureId: string;
  value: string;
  enabled: boolean;
}

export function PlanFeaturesManager({ plan, open, onOpenChange }: PlanFeaturesManagerProps) {
  const { t } = useI18n();
  const { features, updatePlanFeatures, fetchPlans } = useAdminPlans();
  const [featureValues, setFeatureValues] = useState<FeatureValue[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingFeatures, setExistingFeatures] = useState<Record<string, string>>({});

  useEffect(() => {
    if (plan && open) {
      // Fetch plan details to get current feature assignments
      const fetchPlanFeatures = async () => {
        try {
          const { adminPlansClient } = await import('@/core/application/client-services/admin-plans-client.service');
          const res = await adminPlansClient.getPlan(plan.id);
          if (res.success) {
            const existing: Record<string, string> = {};
            for (const pf of res.data.planFeatures) {
              existing[pf.featureId] = pf.value;
            }
            setExistingFeatures(existing);
          }
        } catch {
          // ignore
        }
      };
      fetchPlanFeatures();
    }
  }, [plan, open]);

  useEffect(() => {
    setFeatureValues(
      features.map((f) => {
        let defaultValue = '';
        if (f.type === 'boolean') {
          defaultValue = 'false';
        } else if (f.type === 'number') {
          defaultValue = '0';
        }

        return {
          featureId: f.id,
          value: existingFeatures[f.id] ?? defaultValue,
          enabled: f.id in existingFeatures,
        };
      }),
    );
  }, [features, existingFeatures]);

  const handleSave = useCallback(async () => {
    if (!plan) return;

    // Validate that enabled features have values
    const invalidFeatures = featureValues.filter((fv) => {
      if (!fv.enabled) return false;
      const feature = features.find((f) => f.id === fv.featureId);
      if (!feature) return false;

      if (feature.type === 'number') {
        return fv.value === '' || isNaN(Number(fv.value));
      }
      return fv.value === '';
    });

    if (invalidFeatures.length > 0) {
      toast.error(t('adminPlans.messages.featuresValidationError') || 'Please fill in all enabled feature values');
      return;
    }

    setIsSubmitting(true);
    try {
      const enabledFeatures = featureValues
        .filter((fv) => fv.enabled)
        .map(({ featureId, value }) => ({ featureId, value }));
      await updatePlanFeatures(plan.id, enabledFeatures);
      await fetchPlans();
      toast.success(t('adminPlans.messages.featuresUpdated'));
      onOpenChange(false);
    } catch {
      toast.error(t('adminPlans.messages.featuresUpdateError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [plan, featureValues, updatePlanFeatures, fetchPlans, onOpenChange, t, features]);

  const toggleFeature = useCallback((featureId: string) => {
    setFeatureValues((prev) => prev.map((fv) => (fv.featureId === featureId ? { ...fv, enabled: !fv.enabled } : fv)));
  }, []);

  const setValue = useCallback((featureId: string, value: string) => {
    setFeatureValues((prev) => prev.map((fv) => (fv.featureId === featureId ? { ...fv, value } : fv)));
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('adminPlans.features.manageTitle')}</DialogTitle>
          <DialogDescription>
            {plan?.name} — {t('adminPlans.features.manageDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {features.length === 0 ? (
            <div className="text-muted-foreground text-center text-sm">{t('adminPlans.features.noFeatures')}</div>
          ) : (
            featureValues.map((fv) => {
              const feature = features.find((f) => f.id === fv.featureId);
              if (!feature) return null;
              return (
                <div key={fv.featureId} className="flex items-center gap-3 rounded-lg border p-3">
                  <Switch checked={fv.enabled} onCheckedChange={() => toggleFeature(fv.featureId)} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{feature.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {feature.code} · {feature.type}
                    </div>
                  </div>
                  {fv.enabled && (
                    <div className="w-32">
                      {feature.type === 'boolean' ? (
                        <Switch
                          checked={fv.value === 'true'}
                          onCheckedChange={(v: boolean) => setValue(fv.featureId, String(v))}
                        />
                      ) : (
                        <Input
                          value={fv.value}
                          onChange={(e) => setValue(fv.featureId, e.target.value)}
                          type={feature.type === 'number' ? 'number' : 'text'}
                          placeholder={feature.type === 'number' ? '0' : 'Value'}
                          className="h-8"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.actions.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? t('common.actions.loading') : t('common.actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
