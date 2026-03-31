'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

interface PrintConfigFormProps {
  eventId: string;
  onSuccess?: () => void;
}

export function PrintConfigForm({ eventId, onSuccess }: PrintConfigFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState({
    // Paper
    paperWidth: 62,
    paperHeight: 100,
    orientation: 'PORTRAIT' as 'PORTRAIT' | 'LANDSCAPE',

    // Margins
    marginTop: 5,
    marginRight: 5,
    marginBottom: 5,
    marginLeft: 5,

    // Logos
    showFiventsLogo: true,
    fiventsLogoPosition: 'top' as 'top' | 'bottom',
    fiventsLogoSize: 20,
    showOrgLogo: true,
    orgLogoPosition: 'top' as 'top' | 'bottom',
    orgLogoSize: 25,

    // QR Code
    showQrCode: true,
    qrCodePosition: 'center' as 'top' | 'center' | 'bottom',
    qrCodeSize: 30,
    qrCodeContent: 'participant_id' as 'participant_id' | 'check_in_url' | 'custom',

    // Text
    showName: true,
    namePosition: 'center' as 'top' | 'center' | 'bottom',
    nameFontSize: 16,
    nameBold: true,

    showCompany: true,
    companyPosition: 'center' as 'top' | 'center' | 'bottom',
    companyFontSize: 12,

    showJobTitle: true,
    jobTitlePosition: 'center' as 'top' | 'center' | 'bottom',
    jobTitleFontSize: 10,

    // Printer
    printerDpi: 203,
    printerType: 'thermal' as 'thermal' | 'inkjet' | 'laser',
    printSpeed: 3,
    copies: 1,

    // Colors
    backgroundColor: '#ffffff',
    textColor: '#000000',
    fontFamily: 'Arial',

    itemsOrder: ['fiventsLogo', 'orgLogo', 'name', 'company', 'jobTitle', 'qrCode'],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/print-config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update print configuration');
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <div className="rounded-lg bg-red-100 p-4 text-red-800">{error}</div>}

      {/* Paper Settings */}
      <fieldset className="space-y-4 rounded-lg border border-gray-200 p-4">
        <legend className="text-lg font-semibold">Configurações de Papel</legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Largura (mm)</label>
            <input
              type="number"
              value={config.paperWidth}
              onChange={(e) => setConfig({ ...config, paperWidth: parseFloat(e.target.value) })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Altura (mm)</label>
            <input
              type="number"
              value={config.paperHeight}
              onChange={(e) => setConfig({ ...config, paperHeight: parseFloat(e.target.value) })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Orientação</label>
            <select
              value={config.orientation}
              onChange={(e) => setConfig({ ...config, orientation: e.target.value as 'PORTRAIT' | 'LANDSCAPE' })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="PORTRAIT">Retrato (Portrait)</option>
              <option value="LANDSCAPE">Paisagem (Landscape)</option>
            </select>
          </div>
        </div>
      </fieldset>

      {/* Margins */}
      <fieldset className="space-y-4 rounded-lg border border-gray-200 p-4">
        <legend className="text-lg font-semibold">Margens (mm)</legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Superior</label>
            <input
              type="number"
              value={config.marginTop}
              onChange={(e) => setConfig({ ...config, marginTop: parseFloat(e.target.value) })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Direita</label>
            <input
              type="number"
              value={config.marginRight}
              onChange={(e) => setConfig({ ...config, marginRight: parseFloat(e.target.value) })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Inferior</label>
            <input
              type="number"
              value={config.marginBottom}
              onChange={(e) => setConfig({ ...config, marginBottom: parseFloat(e.target.value) })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Esquerda</label>
            <input
              type="number"
              value={config.marginLeft}
              onChange={(e) => setConfig({ ...config, marginLeft: parseFloat(e.target.value) })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
      </fieldset>

      {/* Logos */}
      <fieldset className="space-y-4 rounded-lg border border-gray-200 p-4">
        <legend className="text-lg font-semibold">Logos</legend>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.showFiventsLogo}
                onChange={(e) => setConfig({ ...config, showFiventsLogo: e.target.checked })}
              />
              <span className="text-sm font-medium">Logo Fivents</span>
            </label>
            {config.showFiventsLogo && (
              <>
                <select
                  value={config.fiventsLogoPosition}
                  onChange={(e) => setConfig({ ...config, fiventsLogoPosition: e.target.value as 'top' | 'bottom' })}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="top">Topo</option>
                  <option value="bottom">Rodapé</option>
                </select>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={config.fiventsLogoSize}
                  onChange={(e) => setConfig({ ...config, fiventsLogoSize: parseFloat(e.target.value) })}
                  className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                  placeholder="Altura (mm)"
                />
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.showOrgLogo}
                onChange={(e) => setConfig({ ...config, showOrgLogo: e.target.checked })}
              />
              <span className="text-sm font-medium">Logo da Organização</span>
            </label>
            {config.showOrgLogo && (
              <>
                <select
                  value={config.orgLogoPosition}
                  onChange={(e) => setConfig({ ...config, orgLogoPosition: e.target.value as 'top' | 'bottom' })}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="top">Topo</option>
                  <option value="bottom">Rodapé</option>
                </select>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={config.orgLogoSize}
                  onChange={(e) => setConfig({ ...config, orgLogoSize: parseFloat(e.target.value) })}
                  className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                  placeholder="Altura (mm)"
                />
              </>
            )}
          </div>
        </div>
      </fieldset>

      {/* QR Code */}
      <fieldset className="space-y-4 rounded-lg border border-gray-200 p-4">
        <legend className="text-lg font-semibold">Código QR</legend>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.showQrCode}
              onChange={(e) => setConfig({ ...config, showQrCode: e.target.checked })}
            />
            <span className="text-sm font-medium">Exibir QR Code</span>
          </label>

          {config.showQrCode && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Posição</label>
                <select
                  value={config.qrCodePosition}
                  onChange={(e) =>
                    setConfig({ ...config, qrCodePosition: e.currentTarget.value as 'top' | 'center' | 'bottom' })
                  }
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                >
                  <option value="top">Topo</option>
                  <option value="center">Centro</option>
                  <option value="bottom">Rodapé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tamanho (mm)</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={config.qrCodeSize}
                  onChange={(e) => setConfig({ ...config, qrCodeSize: parseFloat(e.target.value) })}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Conteúdo do QR</label>
                <select
                  value={config.qrCodeContent}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      qrCodeContent: e.currentTarget.value as 'participant_id' | 'check_in_url' | 'custom',
                    })
                  }
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                >
                  <option value="participant_id">ID do Participante</option>
                  <option value="check_in_url">URL de Check-in</option>
                  <option value="custom">Customizado</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </fieldset>

      {/* Printer Settings */}
      <fieldset className="space-y-4 rounded-lg border border-gray-200 p-4">
        <legend className="text-lg font-semibold">Configurações de Impressora</legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Impressora</label>
            <select
              value={config.printerType}
              onChange={(e) =>
                setConfig({ ...config, printerType: e.currentTarget.value as 'thermal' | 'inkjet' | 'laser' })
              }
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="thermal">Térmica (Zebra, Brother)</option>
              <option value="inkjet">Jato de Tinta</option>
              <option value="laser">Laser</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">DPI</label>
            <input
              type="number"
              min="72"
              max="1200"
              value={config.printerDpi}
              onChange={(e) => setConfig({ ...config, printerDpi: parseInt(e.target.value) })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Velocidade (1-5)</label>
            <input
              type="range"
              min="1"
              max="5"
              value={config.printSpeed}
              onChange={(e) => setConfig({ ...config, printSpeed: parseInt(e.target.value) })}
              className="mt-1 w-full"
            />
            <span className="text-xs text-gray-600">Nível: {config.printSpeed}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cópias</label>
            <input
              type="number"
              min="1"
              max="10"
              value={config.copies}
              onChange={(e) => setConfig({ ...config, copies: parseInt(e.target.value) })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
      </fieldset>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Salvando...' : 'Salvar Configuração de Impressão'}
        </Button>
      </div>
    </form>
  );
}
