// Configuração de credenciais de telemedicina
export function getTelemedicineCredentials() {
  const apiUser = process.env.TELEMEDICINE_API_USER;
  const apiPassword = process.env.TELEMEDICINE_API_PASSWORD;
  return { apiUser, apiPassword };
}
