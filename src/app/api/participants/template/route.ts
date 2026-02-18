import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

/**
 * Download an Excel template for participant import.
 * GET /api/participants/template
 */
export async function GET() {
  const headers = [
    "Nome *",
    "E-mail",
    "Documento (CPF)",
    "Telefone",
    "Empresa",
    "Cargo",
    "URL da Foto (opcional)",
  ];

  const examples = [
    ["João Silva", "joao@empresa.com", "123.456.789-00", "(11) 99999-0001", "Fivents", "Desenvolvedor", ""],
    ["Maria Santos", "maria@empresa.com", "987.654.321-00", "(11) 99999-0002", "TechCorp", "Designer", ""],
    ["Pedro Oliveira", "", "", "", "StartupXYZ", "CEO", ""],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...examples]);

  worksheet["!cols"] = [
    { wch: 25 }, // Nome
    { wch: 30 }, // E-mail
    { wch: 20 }, // Documento
    { wch: 18 }, // Telefone
    { wch: 20 }, // Empresa
    { wch: 20 }, // Cargo
    { wch: 40 }, // URL da Foto
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Participantes");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=template-participantes.xlsx",
    },
  });
}
