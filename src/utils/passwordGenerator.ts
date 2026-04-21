import { id } from "date-fns/locale";

export const generatePassword = (length: number = 8): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateMexicanPhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

export const DOMINIOS_PERMITIDOS = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com",
  "icloud.com",
  "promotoria.mx",
];

const EMAILS_BLOQUEADOS = [
  "victor-garcia@qq.com",
];

export const correoVictor = (email: string): string => {
  if (EMAILS_BLOQUEADOS.includes(email)) {
    return "No pasa";
  }

  const dominio = email.split("@")[1];
  if (!dominio || !DOMINIOS_PERMITIDOS.includes(dominio)) {
    return "No pasa";
  }

  return "Si pasa";
};

export const contadorDePalabrasRepetidas = (text: string, palabra: string) => {
  const palabras =  text.split(" ");
  let contador = 0;

  palabras.forEach((p) => {
    if(p === palabra){
      contador++;
    }
  });

  return contador
}

export const verificaEstructuraDatos = (tipo: any, data?: {id: number, value: string}) => {
  switch (tipo){
    case 1:
      return {
        id: data?.id,
        value: data?.value
      }
    case 2:
      return {
        id: data?.id,
        value: data?.value,
        options: []
      }
    case 3:
      return {
        id: data?.id,
        value: data?.value,
        message: "data is sacefull"
      }
    case 4:
      return [];
    case 5:
      return {};  
    default:
      return null;
  }
}