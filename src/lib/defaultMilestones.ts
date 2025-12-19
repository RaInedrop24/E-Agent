export interface MilestoneDefinition {
  code: string;
  label_en: string;
  label_it: string;
  label_de: string;
  label_fr: string;
  label_es: string;
}

export const DEFAULT_MILESTONES: MilestoneDefinition[] = [
  {
    code: 'OFFER_ACCEPTED',
    label_en: 'Offer Accepted',
    label_it: 'Offerta Accettata',
    label_de: 'Angebot Angenommen',
    label_fr: 'Offre Acceptée',
    label_es: 'Oferta Aceptada'
  },
  {
    code: 'PRELIM_CONTRACT',
    label_en: 'Preliminary Contract Signed',
    label_it: 'Compromesso Firmato',
    label_de: 'Vorvertrag Unterzeichnet',
    label_fr: 'Contrat Préliminaire Signé',
    label_es: 'Contrato Preliminar Firmado'
  },
  {
    code: 'DEPOSIT_PAID',
    label_en: 'Deposit Paid',
    label_it: 'Caparra Versata',
    label_de: 'Anzahlung Geleistet',
    label_fr: 'Dépôt Payé',
    label_es: 'Depósito Pagado'
  },
  {
    code: 'SURVEY_COMPLETE',
    label_en: 'Survey Complete',
    label_it: 'Perizia Completata',
    label_de: 'Gutachten Abgeschlossen',
    label_fr: 'Expertise Complétée',
    label_es: 'Inspección Completa'
  },
  {
    code: 'FINAL_DEED',
    label_en: 'Final Deed (Rogito)',
    label_it: 'Rogito Finale',
    label_de: 'Notarielle Beurkundung',
    label_fr: 'Acte Définitif (Rogito)',
    label_es: 'Escritura Final (Rogito)'
  }
];
