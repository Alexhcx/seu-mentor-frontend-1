export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validarCelular(celular: string): boolean {
  const numeroLimpo = celular.replace(/\D/g, '');
  return /^(\d{10}|\d{11})$/.test(numeroLimpo);
}

export function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '');

  if (!/^\d{11}$/.test(cpfLimpo) || /^(\d)\1{10}$/.test(cpfLimpo)) {
    return false;
  }

  const calcDigito = (base: string, fator: number) => {
    let total = 0;
    for (let i = 0; i < base.length; i++) {
      total += parseInt(base[i]) * fator--;
    }
    const resto = total % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const digito1 = calcDigito(cpfLimpo.substring(0, 9), 10);
  const digito2 = calcDigito(cpfLimpo.substring(0, 9) + digito1, 11);

  return cpfLimpo === cpfLimpo.substring(0, 9) + digito1 + digito2;
}
