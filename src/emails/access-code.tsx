import {
  Body,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'react-email';

// ── Helpers ─────────────────────────────────────────────────────────

function formatEventDate(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: timezone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(date);
  }
}

// ── Types ─────────────────────────────────────────────────────────

export interface AccessCodeEmailProps {
  participantName: string;
  accessCode: string;
  eventName: string;
  eventDate: Date;
  eventTimezone: string;
  eventAddress?: string | null;
  organizationName: string;
  organizationLogoUrl?: string | null;
  fromName?: string;
}

// ── Template ─────────────────────────────────────────────────────

export function AccessCodeEmail({
  participantName,
  accessCode,
  eventName,
  eventDate,
  eventTimezone,
  eventAddress,
  organizationName,
  organizationLogoUrl,
  fromName = 'OneID',
}: AccessCodeEmailProps) {
  const firstName = participantName.split(' ')[0] ?? participantName;
  const formattedDate = formatEventDate(eventDate, eventTimezone);

  return (
    <Html lang="pt-BR" dir="ltr">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>
        Seu código de acesso para {eventName}: {accessCode}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* ── Header ── */}
          <Section style={styles.header}>
            {organizationLogoUrl ? (
              <Img
                src={organizationLogoUrl}
                alt={organizationName}
                width="120"
                height="40"
                style={styles.orgLogo}
              />
            ) : (
              <Text style={styles.orgName}>{organizationName}</Text>
            )}
          </Section>

          {/* ── Hero Banner ── */}
          <Section style={styles.heroBanner}>
            <Text style={styles.heroLabel}>EVENTO</Text>
            <Heading as="h1" style={styles.eventName}>
              {eventName}
            </Heading>
            <Text style={styles.eventDate}>{formattedDate}</Text>
            {eventAddress && <Text style={styles.eventAddress}>📍 {eventAddress}</Text>}
          </Section>

          {/* ── Greeting ── */}
          <Section style={styles.contentSection}>
            <Text style={styles.greeting}>Olá, {firstName}!</Text>
            <Text style={styles.paragraph}>
              Sua inscrição foi confirmada. Abaixo está seu <strong>código de acesso</strong> exclusivo para o evento.
              Apresente-o no totem de credenciamento na entrada.
            </Text>
          </Section>

          {/* ── Code Block ── */}
          <Section style={styles.codeSection}>
            <Text style={styles.codeLabel}>SEU CÓDIGO DE ACESSO</Text>
            <Text style={styles.codeValue}>{accessCode}</Text>
            <Text style={styles.codeHint}>Digite ou mostre este código no totem de credenciamento</Text>
          </Section>

          {/* ── Instructions ── */}
          <Section style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Como usar</Text>
            <Text style={styles.instructionItem}>
              <span style={styles.bullet}>①</span> Chegue ao local do evento
            </Text>
            <Text style={styles.instructionItem}>
              <span style={styles.bullet}>②</span> Localize o totem de credenciamento
            </Text>
            <Text style={styles.instructionItem}>
              <span style={styles.bullet}>③</span> Selecione &quot;Código de Acesso&quot;
            </Text>
            <Text style={styles.instructionItem}>
              <span style={styles.bullet}>④</span> Digite o código acima e confirme
            </Text>
          </Section>

          <Hr style={styles.divider} />

          {/* ── Footer ── */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Este email foi enviado por <strong>{fromName}</strong> em nome de{' '}
              <strong>{organizationName}</strong>.
            </Text>
            <Text style={styles.footerSubtext}>
              Powered by{' '}
              <a href="https://fivents.com" style={styles.footerLink}>
                OneID · Fivents
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#f4f4f7',
    fontFamily: "'Inter', Arial, sans-serif",
    margin: 0,
    padding: 0,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    margin: '40px auto',
    maxWidth: '560px',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  header: {
    backgroundColor: '#0f0f0f',
    padding: '24px 32px',
    textAlign: 'center',
  },
  orgLogo: {
    objectFit: 'contain',
    display: 'block',
    margin: '0 auto',
  },
  orgName: {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
    letterSpacing: '-0.3px',
  },
  heroBanner: {
    background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
    padding: '32px 32px 28px',
    textAlign: 'center',
    borderBottom: '1px solid #3f3f46',
  },
  heroLabel: {
    color: '#71717a',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '1.5px',
    margin: '0 0 8px',
    textTransform: 'uppercase',
  },
  eventName: {
    color: '#fafafa',
    fontSize: '26px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    lineHeight: '1.2',
    margin: '0 0 12px',
  },
  eventDate: {
    color: '#a1a1aa',
    fontSize: '14px',
    margin: '0 0 4px',
  },
  eventAddress: {
    color: '#71717a',
    fontSize: '13px',
    margin: '4px 0 0',
  },
  contentSection: {
    padding: '28px 32px 0',
  },
  greeting: {
    color: '#18181b',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 12px',
  },
  paragraph: {
    color: '#52525b',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 8px',
  },
  codeSection: {
    backgroundColor: '#f8faff',
    border: '2px solid #e0e7ff',
    borderRadius: '12px',
    margin: '24px 32px',
    padding: '28px 24px',
    textAlign: 'center',
  },
  codeLabel: {
    color: '#6366f1',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1.5px',
    margin: '0 0 16px',
    textTransform: 'uppercase',
  },
  codeValue: {
    backgroundColor: '#18181b',
    borderRadius: '8px',
    color: '#ffffff',
    display: 'block',
    fontFamily: "'Courier New', monospace",
    fontSize: '36px',
    fontWeight: '700',
    letterSpacing: '8px',
    margin: '0 auto 16px',
    padding: '16px 24px',
    textAlign: 'center',
  },
  codeHint: {
    color: '#71717a',
    fontSize: '13px',
    margin: 0,
  },
  sectionTitle: {
    color: '#18181b',
    fontSize: '15px',
    fontWeight: '600',
    margin: '0 0 12px',
  },
  instructionItem: {
    color: '#52525b',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0 0 8px',
  },
  bullet: {
    color: '#6366f1',
    fontWeight: '700',
    marginRight: '8px',
  },
  divider: {
    borderColor: '#f4f4f5',
    margin: '28px 32px 0',
  },
  footer: {
    padding: '20px 32px 28px',
    textAlign: 'center',
  },
  footerText: {
    color: '#a1a1aa',
    fontSize: '12px',
    lineHeight: '1.5',
    margin: '0 0 4px',
  },
  footerSubtext: {
    color: '#d4d4d8',
    fontSize: '11px',
    margin: 0,
  },
  footerLink: {
    color: '#6366f1',
    textDecoration: 'none',
  },
};

export default AccessCodeEmail;
