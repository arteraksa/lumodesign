export function publicLoginError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : "";
  if (/does not have access|não possui acesso/i.test(message)) {
    return "Esta conta não possui acesso administrativo ao CMS.";
  }
  if (/network|fetch|timeout|offline/i.test(message)) {
    return "Não foi possível conectar ao serviço de autenticação. Tente novamente.";
  }
  return "E-mail ou senha inválidos.";
}

