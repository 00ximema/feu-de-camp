import emailjs from '@emailjs/browser';

// Configuration EmailJS - à renseigner par l'utilisateur
const EMAILJS_CONFIG_KEY = 'emailjs_config';

export interface EmailJSConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export interface EventEmailData {
  date: string;
  time: string;
  description: string;
  teamMembers: string[];
  jeunes: string[];
}

export const getEmailJSConfig = (): EmailJSConfig | null => {
  const stored = localStorage.getItem(EMAILJS_CONFIG_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
};

export const saveEmailJSConfig = (config: EmailJSConfig): void => {
  localStorage.setItem(EMAILJS_CONFIG_KEY, JSON.stringify(config));
};

export const isEmailJSConfigured = (): boolean => {
  const config = getEmailJSConfig();
  return !!(config?.serviceId && config?.templateId && config?.publicKey);
};

export const sendEventEmail = async (
  recipientEmail: string,
  eventData: EventEmailData
): Promise<void> => {
  const config = getEmailJSConfig();
  
  if (!config) {
    throw new Error('EmailJS non configuré. Veuillez configurer vos identifiants.');
  }

  const personsInvolved = [
    ...eventData.teamMembers.map(name => `• ${name} (équipe)`),
    ...eventData.jeunes.map(name => `• ${name} (jeune)`)
  ].join('\n');

  const templateParams = {
    to_email: recipientEmail,
    event_date: eventData.date,
    event_time: eventData.time,
    event_description: eventData.description,
    persons_involved: personsInvolved || 'Aucune personne spécifiée',
    subject: `Main courante - Événement du ${eventData.date} à ${eventData.time}`
  };

  await emailjs.send(
    config.serviceId,
    config.templateId,
    templateParams,
    config.publicKey
  );
};
