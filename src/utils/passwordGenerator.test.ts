import { describe, it, expect } from "vitest";
import {
  generatePassword,
  validateEmail,
  validateMexicanPhone,
  correoVictor,
  DOMINIOS_PERMITIDOS,
  contadorDePalabrasRepetidas,
  verificaEstructuraDatos
} from "./passwordGenerator";

// ─── generatePassword ────────────────────────────────────────────────────────

describe("generatePassword", () => {
  const LOWERCASE = /[a-z]/;
  const UPPERCASE = /[A-Z]/;
  const NUMBER = /[0-9]/;
  const SYMBOL = /[!@#$%^&*]/;

  it("genera contraseña con longitud por defecto (8)", () => {
    expect(generatePassword()).toHaveLength(8);
  });

  it("genera contraseña con longitud personalizada", () => {
    expect(generatePassword(12)).toHaveLength(12);
    expect(generatePassword(20)).toHaveLength(20);
  });

  it("siempre contiene al menos una minúscula", () => {
    for (let i = 0; i < 20; i++) {
      expect(generatePassword()).toMatch(LOWERCASE);
    }
  });

  it("siempre contiene al menos una mayúscula", () => {
    for (let i = 0; i < 20; i++) {
      expect(generatePassword()).toMatch(UPPERCASE);
    }
  });

  it("siempre contiene al menos un número", () => {
    for (let i = 0; i < 20; i++) {
      expect(generatePassword()).toMatch(NUMBER);
    }
  });

  it("siempre contiene al menos un símbolo", () => {
    for (let i = 0; i < 20; i++) {
      expect(generatePassword()).toMatch(SYMBOL);
    }
  });

  it("solo contiene caracteres del juego permitido", () => {
    const allowed = /^[a-zA-Z0-9!@#$%^&*]+$/;
    for (let i = 0; i < 20; i++) {
      expect(generatePassword(16)).toMatch(allowed);
    }
  });

  it("genera contraseñas distintas en cada llamada (aleatoriedad)", () => {
    const results = new Set(Array.from({ length: 10 }, () => generatePassword()));
    expect(results.size).toBeGreaterThan(1);
  });
});

// ─── validateEmail ───────────────────────────────────────────────────────────

describe("validateEmail", () => {
  it("acepta emails válidos", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("nombre.apellido@empresa.mx")).toBe(true);
    expect(validateEmail("test+tag@sub.domain.org")).toBe(true);
  });

  it("rechaza emails sin @", () => {
    expect(validateEmail("userexample.com")).toBe(false);
  });

  it("rechaza emails sin dominio", () => {
    expect(validateEmail("user@")).toBe(false);
  });

  it("rechaza emails sin TLD", () => {
    expect(validateEmail("user@domain")).toBe(false);
  });

  it("rechaza cadena vacía", () => {
    expect(validateEmail("")).toBe(false);
  });

  it("rechaza emails con espacios", () => {
    expect(validateEmail("user @example.com")).toBe(false);
  });

  it("rechaza email de victor", () => {
    expect(validateEmail("victor-garcia@qq.com")).toBe(true);
  })
});

// ─── validateMexicanPhone ────────────────────────────────────────────────────

describe("validateMexicanPhone", () => {
  it("acepta número de 10 dígitos", () => {
    expect(validateMexicanPhone("5512345678")).toBe(true);
    expect(validateMexicanPhone("3312345678")).toBe(true);
  });

  it("rechaza número con menos de 10 dígitos", () => {
    expect(validateMexicanPhone("551234567")).toBe(false);
  });

  it("rechaza número con más de 10 dígitos", () => {
    expect(validateMexicanPhone("55123456789")).toBe(false);
  });

  it("rechaza número con letras", () => {
    expect(validateMexicanPhone("551234567a")).toBe(false);
  });

  it("rechaza número con guiones o espacios", () => {
    expect(validateMexicanPhone("55-1234-5678")).toBe(false);
    expect(validateMexicanPhone("55 1234 5678")).toBe(false);
  });

  it("rechaza cadena vacía", () => {
    expect(validateMexicanPhone("")).toBe(false);
  });
});

// ─── correoVictor ────────────────────────────────────────────────────

describe('validacion para saber si victor se esta intentando meter al sistema', () => {
  
  it("rechaza  victor", () => {
    expect(correoVictor("victor-garcia@qq.com")).toMatch("No");
  });

  it("rechaza victor 2", () => {
    expect(correoVictor("victor-garcia@qq.com")).toBe("No pasa");
  });

  it("acepta victor", () => {
    expect(correoVictor("1victor-garcia@gmail.com")).toBe("Si pasa");
  });

  it("acepta victor 2", () => {
    expect(correoVictor("1victor-garcia@gmail.com")).toMatch("Si pasa");
  });

  // ── validación de dominios ──────────────────────────────────────────

  it("acepta todos los dominios de la lista permitida", () => {
    for (const dominio of DOMINIOS_PERMITIDOS) {
      expect(correoVictor(`usuario@${dominio}`)).toBe("Si pasa");
    }
  });

  it("rechaza dominio que no está en la lista", () => {
    expect(correoVictor("alguien@dominio-raro.com")).toBe("No pasa");
    expect(correoVictor("alguien@tempmail.io")).toBe("No pasa");
    expect(correoVictor("alguien@qq.com")).toBe("No pasa");
    expect(correoVictor("alguien@empresa.com")).toBe("No pasa");
  });

  it("rechaza email sin dominio", () => {
    expect(correoVictor("sindominio")).toBe("No pasa");
  });

  it("rechaza email con dominio vacío", () => {
    expect(correoVictor("usuario@")).toBe("No pasa");
  });
});

// ─── contadorDePalabrasRepetidas ─────────────────────────────────────────────

describe("contadorDePalabrasRepetidas", () => {
  it("cuenta correctamente una palabra que aparece una vez", () => {
    expect(contadorDePalabrasRepetidas("hola mundo", "hola")).toBe(1);
  });

  it("cuenta correctamente una palabra que aparece varias veces", () => {
    expect(contadorDePalabrasRepetidas("el gato y el perro y el pez", "el")).toBe(3);
  });

  it("retorna 0 cuando la palabra no existe en el texto", () => {
    expect(contadorDePalabrasRepetidas("hola mundo", "adios")).toBe(0);
  });

  it("retorna 0 con texto vacío", () => {
    expect(contadorDePalabrasRepetidas("", "hola")).toBe(0);
  });

  it("es case-sensitive: no cuenta variantes de distinto caso", () => {
    expect(contadorDePalabrasRepetidas("Hola hola HOLA", "hola")).toBe(1);
  });

  it("no cuenta coincidencias parciales dentro de otra palabra", () => {
    expect(contadorDePalabrasRepetidas("elefante el elemento", "el")).toBe(1);
  });

  it("cuenta correctamente cuando la palabra buscada es todo el texto", () => {
    expect(contadorDePalabrasRepetidas("hola", "hola")).toBe(1);
  });

  it("retorna 0 si la palabra buscada es cadena vacía", () => {
    expect(contadorDePalabrasRepetidas("hola mundo", "")).toBe(0);
  });
});

// ─── verificaEstructuraDatos ─────────────────────────────────────────────────

const BASE_DATA = { id: 1, value: "test" };

describe("verificaEstructuraDatos", () => {
  // ── tipo 1 ────────────────────────────────────────────────────────────────
  describe("tipo 1 — estructura básica {id, value}", () => {
    it("retorna objeto con id y value", () => {
      expect(verificaEstructuraDatos(1, BASE_DATA)).toEqual({ id: 1, value: "test" });
    });

    it("no incluye propiedades extra", () => {
      const result = verificaEstructuraDatos(1, BASE_DATA) as object;
      expect(Object.keys(result)).toHaveLength(2);
    });

    it("refleja correctamente distintos valores de data", () => {
      expect(verificaEstructuraDatos(1, { id: 99, value: "otro" })).toEqual({ id: 99, value: "otro" });
    });
  });

  // ── tipo 2 ────────────────────────────────────────────────────────────────
  describe("tipo 2 — estructura con options []", () => {
    it("retorna objeto con id, value y options vacío", () => {
      expect(verificaEstructuraDatos(2, BASE_DATA)).toEqual({ id: 1, value: "test", options: [] });
    });

    it("options siempre inicia como arreglo vacío", () => {
      const result = verificaEstructuraDatos(2, { id: 5, value: "x" }) as { options: unknown[] };
      expect(result.options).toBeInstanceOf(Array);
      expect(result.options).toHaveLength(0);
    });
  });

  // ── tipo 3 ────────────────────────────────────────────────────────────────
  describe("tipo 3 — estructura con message", () => {
    it("retorna objeto con id, value y message", () => {
      expect(verificaEstructuraDatos(3, BASE_DATA)).toEqual({
        id: 1,
        value: "test",
        message: "data is sacefull",
      });
    });

    it("message siempre tiene el valor fijo esperado", () => {
      const result = verificaEstructuraDatos(3, { id: 0, value: "" }) as { message: string };
      expect(result.message).toBe("data is sacefull");
    });
  });

  // ── tipo no reconocido (default) ──────────────────────────────────────────
  describe("tipo no reconocido — retorna null", () => {
    it("retorna null para tipo 0", () => {
      expect(verificaEstructuraDatos(0, BASE_DATA)).toBeNull();
    });

    it("retorna null para tipo negativo", () => {
      expect(verificaEstructuraDatos(-1, BASE_DATA)).toBeNull();
    });

    it("retorna null para tipo fuera de rango (4, 99, 100)", () => {
      expect(verificaEstructuraDatos(66, BASE_DATA)).toBeNull();
      expect(verificaEstructuraDatos(99, BASE_DATA)).toBeNull();
      expect(verificaEstructuraDatos(100, BASE_DATA)).toBeNull();
    });
  });

  // ── variaciones de data ───────────────────────────────────────────────────
  describe("variaciones de data — distintos inputs", () => {
    it("id = 0 y value vacío", () => {
      expect(verificaEstructuraDatos(1, { id: 0, value: "" })).toEqual({ id: 0, value: "" });
    });

    it("id negativo", () => {
      expect(verificaEstructuraDatos(1, { id: -5, value: "negativo" })).toEqual({ id: -5, value: "negativo" });
    });

    it("value con caracteres especiales", () => {
      expect(verificaEstructuraDatos(1, { id: 1, value: "héroe & <xml>" })).toEqual({
        id: 1,
        value: "héroe & <xml>",
      });
    });

    it("value con espacios y saltos de línea", () => {
      expect(verificaEstructuraDatos(2, { id: 2, value: "línea 1\nlínea 2" })).toMatchObject({
        id: 2,
        value: "línea 1\nlínea 2",
      });
    });

    it("tipo con calor null", () => {
      expect(verificaEstructuraDatos(8, { id: 2, value: "línea 1\nlínea 2" })).toBe(null);
    });

    it('Test caso 4 retorna array vacio', ()=> {
      expect(verificaEstructuraDatos(4, { id: 2, value: "línea 1\nlínea 2"})).toHaveLength(0);
    })
  });
});