import * as Brevo from "@getbrevo/brevo";

const brevoKey = process.env.BREVO_API_KEY
  || process.env.BREVO_KEY
  || process.env.BREVO_API
  || process.env.SIB_API_KEY
  || process.env.BREVO_TOKEN
  || "";

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, brevoKey);

export const hasBrevoApiKey = !!brevoKey;
export const brevoApiKeySource = brevoKey
  ? Object.entries({ BREVO_API_KEY: process.env.BREVO_API_KEY, BREVO_KEY: process.env.BREVO_KEY, BREVO_API: process.env.BREVO_API, SIB_API_KEY: process.env.SIB_API_KEY, BREVO_TOKEN: process.env.BREVO_TOKEN })
      .find(([_, v]) => !!v)?.[0]
  : undefined;

export default apiInstance;


