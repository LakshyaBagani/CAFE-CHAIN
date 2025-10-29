declare module '@getbrevo/brevo' {
  export class TransactionalEmailsApi {
    setApiKey(key: any, value: string): void;
    sendTransacEmail(payload: any): Promise<any>;
  }

  export enum TransactionalEmailsApiApiKeys {
    apiKey = 'apiKey',
  }

  const _default: {
    TransactionalEmailsApi: typeof TransactionalEmailsApi;
    TransactionalEmailsApiApiKeys: typeof TransactionalEmailsApiApiKeys;
  };

  export default _default;
}


