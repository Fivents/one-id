import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';

const TEMPLATE_COLUMNS = [
  'Nome',
  'Email',
  'CPF',
  'Telefone',
  'Cargo/Função',
  'Departamento/Setor',
  'Data de Nascimento',
  'Observações',
  'Ativo',
];

export const GET = withAuth(
  withRBAC(['PARTICIPANT_VIEW'], async () => {
    return NextResponse.json({
      columns: TEMPLATE_COLUMNS,
      example: {
        Nome: 'Exemplo de Nome',
        Email: 'exemplo@email.com',
        CPF: '000.000.000-00',
        Telefone: '(11) 99999-9999',
        'Cargo/Função': '',
        'Departamento/Setor': '',
        'Data de Nascimento': 'DD/MM/AAAA',
        Observações: '',
        Ativo: 'Sim',
      },
    });
  }),
);
