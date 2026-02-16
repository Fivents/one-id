"use client"

import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export type ExportColumn = {
  key: string
  header: string
  width?: number
  format?: (value: unknown) => string
}

export type PDFExportOptions = {
  title?: string
  subtitle?: string
  orientation?: "portrait" | "landscape"
}

function formatValue(value: unknown, locale: string): string {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) return value.toLocaleDateString(locale)
  if (typeof value === "boolean") return value ? "Sim" : "Não"
  return String(value)
}

function resolveValue(row: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc !== null && acc !== undefined && typeof acc === "object") {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, row)
}

function buildRows(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  locale: string,
): string[][] {
  return data.map((row) =>
    columns.map((col) => {
      const raw = resolveValue(row, col.key)
      return col.format ? col.format(raw) : formatValue(raw, locale)
    }),
  )
}

export function exportToExcel(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string,
  locale = "pt-BR",
) {
  const headers = columns.map((c) => c.header)
  const rows = buildRows(data, columns, locale)

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])

  worksheet["!cols"] = columns.map((col) => ({
    wch: col.width ?? Math.max(col.header.length, 12),
  }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Dados")

  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

export function exportToPDF(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string,
  options: PDFExportOptions = {},
  locale = "pt-BR",
) {
  const { title, subtitle, orientation = "portrait" } = options

  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()

  let startY = 15

  if (title) {
    doc.setFontSize(16)
    doc.text(title, pageWidth / 2, startY, { align: "center" })
    startY += 8
  }

  if (subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(subtitle, pageWidth / 2, startY, { align: "center" })
    doc.setTextColor(0)
    startY += 8
  }

  const headers = columns.map((c) => c.header)
  const rows = buildRows(data, columns, locale)

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 37, 36], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 244] },
    columnStyles: columns.reduce(
      (acc, col, i) => {
        if (col.width) acc[i] = { cellWidth: col.width }
        return acc
      },
      {} as Record<number, { cellWidth: number }>,
    ),
    didDrawPage: () => {
      const pageHeight = doc.internal.pageSize.getHeight()
      doc.setFontSize(7)
      doc.setTextColor(150)
      doc.text(
        `Gerado por OneID by Fivents — ${new Date().toLocaleDateString(locale)}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" },
      )
    },
  })

  doc.save(`${filename}.pdf`)
}

// ---------------------------------------------------------------------------
// Pre-configured export helpers
// ---------------------------------------------------------------------------

export function exportParticipants(
  participants: Record<string, unknown>[],
  locale = "pt-BR",
) {
  const columns: ExportColumn[] = [
    { key: "name", header: "Nome", width: 30 },
    { key: "email", header: "E-mail", width: 30 },
    { key: "document", header: "Documento", width: 18 },
    { key: "phone", header: "Telefone", width: 16 },
    {
      key: "status",
      header: "Status",
      width: 14,
      format: (v) => {
        const map: Record<string, string> = {
          REGISTERED: "Cadastrado",
          CHECKED_IN: "Check-in",
          CANCELLED: "Cancelado",
        }
        return map[String(v)] ?? String(v ?? "")
      },
    },
    {
      key: "createdAt",
      header: "Cadastro",
      width: 14,
      format: (v) =>
        v ? new Date(v as string).toLocaleDateString(locale) : "",
    },
  ]

  const ts = new Date().toISOString().slice(0, 10)

  exportToExcel(participants, columns, `participantes-${ts}`, locale)
}

export function exportCheckIns(
  checkIns: Record<string, unknown>[],
  locale = "pt-BR",
) {
  const columns: ExportColumn[] = [
    { key: "participant.name", header: "Participante", width: 28 },
    { key: "participant.email", header: "E-mail", width: 28 },
    { key: "checkpointName", header: "Ponto", width: 20 },
    {
      key: "checkedInAt",
      header: "Data/Hora",
      width: 20,
      format: (v) =>
        v ? new Date(v as string).toLocaleString(locale) : "",
    },
    { key: "method", header: "Método", width: 14 },
  ]

  const ts = new Date().toISOString().slice(0, 10)

  exportToExcel(checkIns, columns, `checkins-${ts}`, locale)
}

export function exportEvents(
  events: Record<string, unknown>[],
  locale = "pt-BR",
) {
  const columns: ExportColumn[] = [
    { key: "name", header: "Evento", width: 30 },
    { key: "location", header: "Local", width: 24 },
    {
      key: "startDate",
      header: "Início",
      width: 14,
      format: (v) =>
        v ? new Date(v as string).toLocaleDateString(locale) : "",
    },
    {
      key: "endDate",
      header: "Término",
      width: 14,
      format: (v) =>
        v ? new Date(v as string).toLocaleDateString(locale) : "",
    },
    {
      key: "status",
      header: "Status",
      width: 14,
      format: (v) => {
        const map: Record<string, string> = {
          DRAFT: "Rascunho",
          PUBLISHED: "Publicado",
          ONGOING: "Em andamento",
          FINISHED: "Encerrado",
          CANCELLED: "Cancelado",
        }
        return map[String(v)] ?? String(v ?? "")
      },
    },
    {
      key: "_count.participants",
      header: "Participantes",
      width: 14,
      format: (v) => String(v ?? 0),
    },
  ]

  const ts = new Date().toISOString().slice(0, 10)

  exportToExcel(events, columns, `eventos-${ts}`, locale)
}
