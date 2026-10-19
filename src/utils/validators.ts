// obs: Lógica do backend replicada aqui para evitar chamadas desnecessárias à API. 


export function validarCPF(cpf) {
  cpf = (cpf ?? "").replace(/\D/g, ""); // remove pontos, traço etc.

  if (cpf.length !== 11) return false;

  if (cpf === cpf[0].repeat(11)) return false; // rejeita 111.111.111-11 etc.

  function calcularDigito(cpfParcial, pesoInicial) {
    let soma = 0;
    let peso = pesoInicial;
    for (const digito of cpfParcial) {
      soma += Number(digito) * peso;
      peso -= 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }

  const digito1 = calcularDigito(cpf.slice(0, 9), 10);
  const digito2 = calcularDigito(cpf.slice(0, 10), 11);

  return cpf.slice(-2) === `${digito1}${digito2}`;
}

export function validarTelefone(telefone) {
  const digitos = (telefone ?? "").replace(/\D/g, "");
  return digitos.length === 10 || digitos.length === 11;
}

export function validarCNPJ(cnpj) {
  cnpj = (cnpj ?? "").replace(/[^\d]+/g, "");

  if (cnpj.length !== 14) return false;

  // Rejeita sequências de dígitos iguais
  if (/^(\d)\1+$/.test(cnpj)) return false;

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);

  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += Number(numeros[tamanho - i]) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== Number(digitos[0])) return false;

  tamanho++;
  numeros = cnpj.substring(0, tamanho);

  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += Number(numeros[tamanho - i]) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === Number(digitos[1]);
}